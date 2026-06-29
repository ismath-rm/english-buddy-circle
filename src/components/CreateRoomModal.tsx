"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Shield, ShieldOff, Loader2 } from "lucide-react";
import { CATEGORIES, DIFFICULTIES, CategoryType, DifficultyType } from "@/utils/helpers";
import { supabase } from "@/lib/supabase";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  
  // Form States
  const [hostName, setHostName] = useState("");
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState<CategoryType>("Daily Conversation");
  const [difficulty, setDifficulty] = useState<DifficultyType>("Intermediate");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load Host Name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("ebc_username");
    if (savedName) setHostName(savedName);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (!hostName.trim()) return setErrorMsg("Your Name is required");
    if (!name.trim()) return setErrorMsg("Room Name is required");
    if (!topic.trim()) return setErrorMsg("Speaking Topic is required");
    if (isPrivate && !password.trim()) return setErrorMsg("Password is required for private rooms");

    setIsSubmitting(true);

    try {
      // 1. Save username to localStorage
      localStorage.setItem("ebc_username", hostName.trim());

      // 2. Insert room into Supabase
      const { data, error } = await supabase
        .from("rooms")
        .insert({
          name: name.trim(),
          topic: topic.trim(),
          category,
          difficulty,
          max_participants: maxParticipants,
          host_name: hostName.trim(),
          description: description.trim() || null,
          is_private: isPrivate,
          password: isPrivate ? password.trim() : null
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      // 3. Create participant entry for the host
      // Since we need a unique session ID for the tab, we will generate one here and pass it
      const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      const { error: partError } = await supabase.from("participants").insert({
        room_id: data.id,
        session_id: sessionId,
        user_name: hostName.trim()
      });

      if (partError) throw partError;

      // 4. Save session ID to sessionStorage to recognize the host
      sessionStorage.setItem(`ebc_session_${data.id}`, sessionId);

      // 5. Navigate to the room page
      router.push(`/rooms/${data.id}`);
      onClose();
    } catch (err: any) {
      console.error("Error creating room:", err);
      setErrorMsg(err.message || "Failed to create room. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl glass border border-slate-200/50 dark:border-slate-800/40 p-6 sm:p-8 shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200 text-slate-800 dark:text-slate-100 bg-white dark:bg-[#131526]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Create a Speaking Room</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Setup your English speaking room. Hosts can set topics and practice level filters.
          </p>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200/30 dark:border-rose-500/20">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Host name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Host Name</label>
            <input 
              type="text" 
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g. Teacher Sarah / Alex"
              className="text-sm rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors"
              required
              maxLength={40}
            />
          </div>

          {/* Room details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Room Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fluent Speaking Circle"
                className="text-sm rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors"
                required
                maxLength={50}
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Speaking Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. My Favorite Books & Movies"
                className="text-sm rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors"
                required
                maxLength={80}
              />
            </div>
          </div>

          {/* Select Category & Limit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryType)}
                className="text-sm rounded-xl px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Max Speakers: <span className="text-brand-500 font-bold">{maxParticipants}</span>
              </label>
              <input
                type="range"
                min="2"
                max="50"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                className="h-2 my-auto bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
          </div>

          {/* Difficulty Toggles */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Target Level</label>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(lvl => (
                <button
                  type="button"
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    difficulty === lvl
                      ? "bg-brand-600 text-white border-transparent shadow-md shadow-brand-500/10"
                      : "bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Free-flow discussion. Let's introduce ourselves and review films."
              className="text-sm rounded-xl px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 focus:outline-none focus:border-brand-500 transition-colors h-16 resize-none"
              maxLength={200}
            />
          </div>

          {/* Privacy Controls */}
          <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200/40 dark:border-slate-800/40 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPrivate ? (
                  <Shield className="w-4 h-4 text-brand-500" />
                ) : (
                  <ShieldOff className="w-4 h-4 text-slate-400" />
                )}
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Private Password-Protected Room</span>
              </div>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-slate-200 dark:bg-slate-800 border-slate-300 accent-brand-500"
              />
            </div>

            {isPrivate && (
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter room password"
                className="text-xs rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 mt-1"
                maxLength={20}
                required={isPrivate}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-4 border-t border-slate-200/50 dark:border-slate-800/30 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/10 hover:shadow-brand-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create &amp; Launch</span>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
