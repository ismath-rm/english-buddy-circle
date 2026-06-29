"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search, Filter, RefreshCw, MessageCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, DIFFICULTIES, CategoryType, DifficultyType } from "@/utils/helpers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RoomCard from "@/components/RoomCard";
import CreateRoomModal from "@/components/CreateRoomModal";

interface Room {
  id: string;
  name: string;
  topic: string;
  category: string;
  difficulty: string;
  max_participants: number;
  host_name: string;
  description?: string;
  is_private: boolean;
  created_at: string;
  participant_count: number;
}

function DashboardContent() {
  const searchParams = useSearchParams();
  
  // State
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("All");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Fetch Rooms with their participant counts
  const fetchRooms = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      // Fetch rooms and count of participants per room
      const { data, error } = await supabase
        .from("rooms")
        .select(`
          *,
          participants (
            id
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map Supabase payload to match our Room structure with participant count
      const mappedRooms: Room[] = (data || []).map((room: any) => ({
        id: room.id,
        name: room.name,
        topic: room.topic,
        category: room.category,
        difficulty: room.difficulty,
        max_participants: room.max_participants,
        host_name: room.host_name,
        description: room.description,
        is_private: room.is_private,
        created_at: room.created_at,
        participant_count: room.participants ? room.participants.length : 0
      }));

      // Filter out empty rooms to show only active rooms
      const activeRooms = mappedRooms.filter((room) => room.participant_count > 0);

      setRooms(activeRooms);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Trigger modal if "?create=true" query param is present on load
  useEffect(() => {
    if (searchParams.get("create") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Initial Fetch & Realtime Subscriptions
  useEffect(() => {
    fetchRooms();

    // Listen for additions, deletions, or modifications on rooms and participants
    const roomsChannel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => {
          console.log("Realtime: Rooms updated. Re-fetching...");
          fetchRooms(true);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => {
          console.log("Realtime: Participants count updated. Re-fetching...");
          fetchRooms(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, []);

  // Filtered rooms logic
  const filteredRooms = rooms.filter((room) => {
    // Search queries (name, topic, host)
    const matchesSearch =
      room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.host_name.toLowerCase().includes(searchQuery.toLowerCase());

    // Difficulty filter
    const matchesDifficulty =
      filterDifficulty === "All" || room.difficulty === filterDifficulty;

    // Category filter
    const matchesCategory =
      filterCategory === "All" || room.category === filterCategory;

    return matchesSearch && matchesDifficulty && matchesCategory;
  });

  return (
    <>
      <Navbar />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
        
        {/* DASHBOARD HEADER */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight dark:text-white">English Speaking Rooms</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Browse the list below to join active practice groups or launch your own room.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-tr from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white shadow-lg shadow-brand-500/15 transition-all text-center"
          >
            <Plus className="w-4 h-4" />
            <span>Create a Room</span>
          </button>
        </section>

        {/* SEARCH & FILTERS CONTROLS BAR */}
        <section className="p-4 rounded-2xl glass border border-slate-200/40 dark:border-slate-800/30 flex flex-col lg:flex-row items-center gap-4">
          
          {/* Search Field */}
          <div className="relative w-full lg:flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, topics, or hosts..."
              className="w-full text-sm rounded-xl pl-10 pr-4 py-2 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {/* Difficulty filter dropdown */}
          <div className="flex items-center gap-2 w-full lg:w-auto shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full lg:w-44 text-sm rounded-xl px-3 py-2 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="All">All Difficulties</option>
              {DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {diff}
                </option>
              ))}
            </select>
          </div>

          {/* Category filter dropdown */}
          <div className="w-full lg:w-auto shrink-0">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full lg:w-52 text-sm rounded-xl px-3 py-2 bg-slate-100/50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Manual Refresh button */}
          <button
            onClick={() => fetchRooms(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/50 dark:hover:bg-slate-800/80 border border-slate-200/40 dark:border-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
            title="Refresh Rooms List"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>

        </section>

        {/* ROOM CARDS GRID */}
        {loading ? (
          /* Skeletons Loading State */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-[280px] rounded-2xl border border-slate-200/50 dark:border-slate-800/40 bg-white/20 dark:bg-slate-900/10 p-6 flex flex-col justify-between animate-pulse"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                    <div className="w-24 h-5 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                  </div>
                  <div className="w-3/4 h-6 rounded bg-slate-200 dark:bg-slate-800"></div>
                  <div className="w-1/2 h-4 rounded bg-slate-200 dark:bg-slate-800"></div>
                </div>
                <div className="w-full h-10 rounded-xl bg-slate-200 dark:bg-slate-800 mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          /* Empty State Illustration */
          <div className="flex-grow flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/10 dark:bg-slate-900/5">
            <div className="p-4 rounded-full bg-brand-50 dark:bg-brand-500/10 w-fit mb-4">
              <MessageCircle className="w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-xl font-bold dark:text-white">No active speaking rooms</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              We couldn't find any rooms matching your search options. Create the first speaking room to start practicing!
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/15 hover:shadow-brand-500/25 transition-all text-center"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Room</span>
            </button>
          </div>
        ) : (
          /* Rooms Display Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}

      </main>

      {/* CREATE MODAL */}
      <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <Footer />
    </>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 dark:bg-[#0b0c16]">
        <RefreshCw className="w-10 h-10 animate-spin text-brand-500" />
        <span className="text-sm font-medium text-slate-400 font-sans">Loading rooms...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
