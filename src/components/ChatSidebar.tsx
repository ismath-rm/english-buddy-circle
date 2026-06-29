"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Smile, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  room_id: string;
  sender_name: string;
  text: string;
  created_at: string;
}

interface ChatSidebarProps {
  roomId: string;
  userName: string;
}

const EMOJIS = ["👋", "😂", "👍", "🔥", "🎉", "💯", "😮", "🤔"];

export default function ChatSidebar({ roomId, userName }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto Scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch history and listen to realtime updates
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error("Error fetching chat messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to database changes for messages in this specific room
    const chatChannel = supabase
      .channel(`room-chat-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          const insertedMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid adding duplicates (e.g. if local insert and realtime insert trigger together)
            if (prev.some((m) => m.id === insertedMessage.id)) return prev;
            return [...prev, insertedMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
    };
  }, [roomId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage(""); // Clear early for optimistic UX feeling

    try {
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        sender_name: userName,
        text: messageText
      });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to send message:", err);
      // Fallback: restore input on error
      setNewMessage(messageText);
    }
  };

  const sendEmoji = async (emoji: string) => {
    try {
      const { error } = await supabase.from("messages").insert({
        room_id: roomId,
        sender_name: userName,
        text: emoji
      });
      if (error) throw error;
    } catch (err) {
      console.error("Failed to send emoji:", err);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl glass-card border border-slate-200/40 dark:border-slate-800/40 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/40 bg-white/50 dark:bg-slate-900/50 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-brand-500" />
        <h3 className="font-bold text-sm dark:text-white uppercase tracking-wider">Room Chat</h3>
      </div>

      {/* Messages Stream */}
      <div className="flex-grow p-4 overflow-y-auto flex flex-col gap-3 min-h-0">
        {isLoading ? (
          <div className="flex-grow flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">
              No messages yet. Say hi in English to start practicing!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.sender_name === userName;
            const time = new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });
            
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${
                  isSelf ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 px-1">
                  {isSelf ? "You" : msg.sender_name} • {time}
                </span>
                <div
                  className={`px-3 py-2 rounded-2xl text-sm break-words ${
                    isSelf
                      ? "bg-brand-600 text-white rounded-tr-none"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/20"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Bar */}
      <div className="px-4 py-1.5 border-t border-slate-200/30 dark:border-slate-800/20 bg-slate-50/50 dark:bg-slate-900/30 flex justify-between gap-1 overflow-x-auto">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendEmoji(emoji)}
            className="hover:scale-125 transition-transform p-1 text-base select-none"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Form Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-slate-200/50 dark:border-slate-800/40 bg-white/80 dark:bg-slate-950/80 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message in English..."
          className="flex-grow text-sm rounded-xl px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200/40 dark:border-slate-800/40 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-500 transition-colors"
          maxLength={500}
        />
        <button
          type="submit"
          className="p-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/20 transition-all flex items-center justify-center shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
