"use client";

import Link from "next/link";
import { Users, BookOpen, User, Calendar, ShieldAlert } from "lucide-react";
import { formatTimeAgo, DifficultyType } from "@/utils/helpers";

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
  participant_count: number; // We will compute this or fetch it from supabase
}

interface RoomCardProps {
  room: Room;
}

export default function RoomCard({ room }: RoomCardProps) {
  // Styling for difficulty badges
  const getDifficultyStyles = (difficulty: string) => {
    switch (difficulty as DifficultyType) {
      case "Beginner":
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20";
      case "Intermediate":
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-500/20";
      case "Advanced":
        return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-500/20";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/20";
    }
  };

  // Check if room is full
  const isFull = room.participant_count >= room.max_participants;

  return (
    <div className="group relative rounded-2xl glass-card hover:scale-[1.01] hover:border-brand-500/30 transition-all duration-300 flex flex-col justify-between overflow-hidden p-6 gap-6 h-full">
      {/* Background soft glow on card hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

      {/* Top Section: Topic & Title */}
      <div className="flex flex-col gap-3.5">
        
        {/* Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getDifficultyStyles(room.difficulty)}`}>
            {room.difficulty}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200/30 dark:border-brand-500/20">
            {room.category}
          </span>
          {room.is_private && (
            <span className="flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <ShieldAlert className="w-3 h-3" />
              <span>Password Required</span>
            </span>
          )}
        </div>

        {/* Room Name & Topic */}
        <div>
          <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight mb-1 group-hover:text-brand-500 transition-colors">
            {room.name}
          </h3>
          <div className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <BookOpen className="w-4 h-4 text-brand-500 shrink-0 mt-0.5" />
            <p className="line-clamp-2">Topic: <strong className="font-semibold text-slate-700 dark:text-slate-300">{room.topic}</strong></p>
          </div>
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
            {room.description}
          </p>
        )}
      </div>

      {/* Bottom Section: Details & CTA */}
      <div className="flex flex-col gap-4 border-t border-slate-200/50 dark:border-slate-800/30 pt-4">
        
        {/* Host & Count Grid */}
        <div className="grid grid-cols-2 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate">Host: <strong className="font-semibold text-slate-700 dark:text-slate-300">{room.host_name}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 justify-end">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className={isFull ? "text-rose-500 font-semibold" : ""}>
              {room.participant_count || 0} / {room.max_participants} joined
            </span>
          </div>

          <div className="flex items-center gap-1.5 col-span-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Created {formatTimeAgo(room.created_at)}</span>
          </div>
        </div>

        {/* CTA Button */}
        <Link
          href={`/rooms/${room.id}`}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 border transition-all ${
            isFull
              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 cursor-not-allowed"
              : "bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 border-transparent hover:translate-y-[-1px]"
          }`}
        >
          <span>{isFull ? "Room is Full" : "Join Room"}</span>
        </Link>
      </div>

    </div>
  );
}
