"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Users, BookOpen, User, Shield, Info, 
  ArrowLeft, LogOut, CheckCircle, ShieldAlert, Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { DifficultyType } from "@/utils/helpers";
import JitsiMeeting from "@/components/JitsiMeeting";
import ChatSidebar from "@/components/ChatSidebar";


interface RoomDetails {
  id: string;
  name: string;
  topic: string;
  category: string;
  difficulty: string;
  max_participants: number;
  host_name: string;
  description?: string;
  is_private: boolean;
  password?: string;
}

interface Participant {
  id: string;
  user_name: string;
  session_id: string;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  // States
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Name & Pass Entry States
  const [userName, setUserName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [promptName, setPromptName] = useState(false);
  
  // Realtime Participants State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const participantAddedRef = useRef(false);

  // Styling helpers
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty as DifficultyType) {
      case "Beginner": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "Intermediate": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
      case "Advanced": return "text-rose-500 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  // Fetch Room Info
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (error || !data) {
          throw new Error("Room not found or has been closed.");
        }

        setRoom(data);
        const isVerified = !data.is_private || sessionStorage.getItem(`ebc_verified_${roomId}`) === "true";
        setIsPasswordVerified(isVerified);

        // Check for username cache in localStorage
        const cachedName = localStorage.getItem("ebc_username");
        if (cachedName) {
          setUserName(cachedName);
        } else {
          setPromptName(true);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load room.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoomDetails();
  }, [roomId]);

  // Handle participant inserts and unloads
  useEffect(() => {
    // Only add participant once metadata is loaded, username is set, and password verified
    if (!room || !userName || !isPasswordVerified || participantAddedRef.current) return;

    // Retrieve or create tab session ID to identify the connection
    let sessionId = sessionStorage.getItem(`ebc_session_${roomId}`);
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem(`ebc_session_${roomId}`, sessionId);
    }

    const addParticipant = async () => {
      participantAddedRef.current = true;
      try {
        const { error } = await supabase
          .from("participants")
          .insert({
            room_id: roomId,
            session_id: sessionId,
            user_name: userName
          });
        
        // Handle constraint errors (already exists)
        if (error && error.code !== "23505") {
          console.error("Supabase participant insert failed:", error);
        }
      } catch (e) {
        console.error("Error setting up participant:", e);
      }
    };

    addParticipant();

    // Fetch initial participant list
    const fetchParticipants = async () => {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("room_id", roomId);
      if (data) setParticipants(data);
    };
    fetchParticipants();

    // Subscribe to participant additions and removals
    const pChannel = supabase
      .channel(`room-participants-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newP = payload.new as Participant;
            setParticipants((prev) => {
              if (prev.some((p) => p.id === newP.id)) return prev;
              return [...prev, newP];
            });
          }
          if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as any).id;
            setParticipants((prev) => prev.filter((p) => p.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Clean up participant on beforeunload & unmount
    const cleanupUser = () => {
      const sessionIdStr = sessionStorage.getItem(`ebc_session_${roomId}`);
      if (!sessionIdStr) return;

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        const url = `${supabaseUrl}/rest/v1/participants?session_id=eq.${sessionIdStr}&room_id=eq.${roomId}`;
        fetch(url, {
          method: "DELETE",
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`,
            "Content-Type": "application/json"
          },
          keepalive: true
        }).catch(err => console.error("Unload fetch error:", err));
      }

      // Direct async deletion
      supabase
        .from("participants")
        .delete()
        .eq("session_id", sessionIdStr)
        .eq("room_id", roomId)
        .then(({ error }) => {
          if (error) console.error("Error cleaning participant:", error);
        });
    };

    window.addEventListener("beforeunload", cleanupUser);

    return () => {
      window.removeEventListener("beforeunload", cleanupUser);
      supabase.removeChannel(pChannel);
      cleanupUser();
    };
  }, [room, userName, isPasswordVerified, roomId]);

  // Actions
  const verifyPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;
    if (passwordInput.trim() === room.password) {
      setIsPasswordVerified(true);
      sessionStorage.setItem(`ebc_verified_${roomId}`, "true");
      setError("");
    } else {
      setError("Incorrect password. Please try again.");
    }
  };

  const saveUserName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    localStorage.setItem("ebc_username", nameInput.trim());
    setUserName(nameInput.trim());
    setPromptName(false);
  };

  const handleLeaveRoom = () => {
    const sessionId = sessionStorage.getItem(`ebc_session_${roomId}`);
    if (sessionId) {
      supabase
        .from("participants")
        .delete()
        .eq("session_id", sessionId)
        .eq("room_id", roomId)
        .then(() => {
          router.push("/rooms");
        });
    } else {
      router.push("/rooms");
    }
  };

  // Rendering States
  if (loading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-brand-500" />
        <span className="text-sm font-medium text-slate-400">Verifying session details...</span>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-4 text-center">
        <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 mb-4">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold dark:text-white">Failed to join room</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
        <button
          onClick={() => router.push("/rooms")}
          className="mt-6 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Rooms</span>
        </button>
      </div>
    );
  }

  // 1. Password Protection Card
  if (!isPasswordVerified && room?.is_private) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass border border-slate-200/50 dark:border-slate-800/40 shadow-2xl bg-white dark:bg-[#131526]">
          <div className="flex flex-col items-center text-center gap-4 mb-6">
            <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-full border border-brand-200/40 dark:border-brand-500/20 text-brand-500">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold dark:text-white">Private Room</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter the password for <strong className="text-slate-700 dark:text-slate-300">&ldquo;{room.name}&rdquo;</strong> to connect.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200/30 dark:border-rose-500/20">
              {error}
            </div>
          )}

          <form onSubmit={verifyPassword} className="flex flex-col gap-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter Room Password"
              className="text-sm rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors text-center font-mono tracking-widest"
              required
            />
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/rooms")}
                className="flex-grow py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-grow py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 transition-all"
              >
                Verify &amp; Enter
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. Name Prompt Card
  if (promptName || !userName) {
    return (
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl glass border border-slate-200/50 dark:border-slate-800/40 shadow-2xl bg-white dark:bg-[#131526]">
          <div className="flex flex-col items-center text-center gap-4 mb-6">
            <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-full border border-brand-200/40 dark:border-brand-500/20 text-brand-500">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold dark:text-white">What is your name?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter a username so other English buddies recognize you in the call and chat.
              </p>
            </div>
          </div>

          <form onSubmit={saveUserName} className="flex flex-col gap-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Alex / Maria"
              className="text-sm rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors text-center"
              required
              maxLength={30}
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => router.push("/rooms")}
                className="flex-grow py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-grow py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 transition-all"
              >
                Start Practicing
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. Main Call Screen
  return (
    <div className="flex-grow flex flex-col lg:h-screen lg:overflow-hidden min-h-screen">
      
      {/* ROOM HEADER PANEL */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/70 dark:bg-[#0b0c16]/70 backdrop-blur-md shrink-0 h-16">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={handleLeaveRoom}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400"
              title="Leave Room"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-base text-slate-950 dark:text-white truncate leading-tight">
                {room?.name}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                <BookOpen className="w-3 h-3 text-brand-500" />
                <span>Topic: <strong className="font-semibold">{room?.topic}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Difficulty Badge */}
            <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyColor(room?.difficulty || "")}`}>
              {room?.difficulty}
            </span>

            {/* Leave Room Button */}
            <button
              onClick={handleLeaveRoom}
              className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-200/20 dark:border-rose-500/20 transition-all shrink-0 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Room</span>
            </button>
          </div>

        </div>
      </header>

      {/* CORE MEETING INTERFACE CONTAINER */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 py-4 flex flex-col lg:flex-row gap-4 min-h-0 lg:overflow-hidden mt-16">
        
        {/* Left Side: Jitsi Meeting Screen */}
        <div className="w-full lg:flex-grow h-[50vh] lg:h-full min-h-[350px] lg:min-h-0 shrink-0 lg:shrink">
          <JitsiMeeting 
            roomId={roomId} 
            userName={userName} 
            onLeave={handleLeaveRoom} 
          />
        </div>

        {/* Right Side: Sidebar Controls panel (Scrollable) */}
        <aside className="w-full lg:w-96 shrink-0 flex flex-col gap-4 lg:overflow-y-auto lg:h-full min-h-0">
          
          {/* Room info & Guidelines Card */}
          <div className="p-4 rounded-2xl glass-card border border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-2.5">
              <Info className="w-3.5 h-3.5 text-brand-500" />
              <span>Room Guidelines</span>
            </div>
            
            {/* Rules list */}
            <ul className="text-xs text-slate-600 dark:text-slate-400 flex flex-col gap-1.5 list-none">
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Speak <strong>only English</strong> to practice effectively.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Respect everyone and encourage beginners.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Microphone recommended. Camera is optional.</span>
              </li>
            </ul>

            {/* Room description */}
            {room?.description && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/30 text-xs text-slate-500 dark:text-slate-400 leading-relaxed italic">
                &ldquo;{room.description}&rdquo;
              </div>
            )}
          </div>

          {/* Speakers Presence list removed */}



          {/* Chat Component */}
          <div className="flex-grow lg:h-80 min-h-[300px]">
            <ChatSidebar roomId={roomId} userName={userName} />
          </div>

        </aside>

      </div>

    </div>
  );
}
