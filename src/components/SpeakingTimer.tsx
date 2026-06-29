"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Timer } from "lucide-react";

export default function SpeakingTimer() {
  const [duration, setDuration] = useState<number>(60); // default 60 seconds
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync timeLeft when duration is selected
  useEffect(() => {
    setTimeLeft(duration);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [duration]);

  // Handle countdown
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playAlarmSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Synthesize alarm sound using Web Audio API (free, reliable, instant)
  const playAlarmSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Play a nice double chime
      const playTone = (timeOffset: number, freq: number, dur: number) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime + timeOffset);
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + timeOffset);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + timeOffset + dur - 0.05);
        
        oscillator.start(audioCtx.currentTime + timeOffset);
        oscillator.stop(audioCtx.currentTime + timeOffset + dur);
      };

      // Play "high chime, low chime" sequence
      playTone(0, 880, 0.4); // High note
      playTone(0.3, 660, 0.6); // Low note
    } catch (e) {
      console.error("Failed to play synthesized alarm:", e);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  const durations = [
    { label: "30s", value: 30 },
    { label: "60s", value: 60 },
    { label: "90s", value: 90 },
    { label: "2m", value: 120 }
  ];

  // Calculate progress circle percentage
  const percentage = (timeLeft / duration) * 100;
  const strokeDashoffset = 220 - (220 * percentage) / 100;

  return (
    <div className="p-5 rounded-2xl glass-card flex flex-col items-center gap-4">
      
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
        <Timer className="w-3.5 h-3.5 text-brand-500" />
        <span>Speaking Timer</span>
      </div>

      {/* Circle Progress Timer */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="35"
            className="stroke-slate-200/50 dark:stroke-slate-800/50 fill-none"
            strokeWidth="4"
          />
          <circle
            cx="40"
            cy="40"
            r="35"
            className="stroke-brand-500 fill-none transition-all duration-1000 ease-linear"
            strokeWidth="4"
            strokeDasharray="220"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Countdown display */}
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold font-mono tracking-tight dark:text-white">
            {formatTime(timeLeft)}
          </span>
          <span className="text-[10px] text-slate-400">
            {isRunning ? "Speaking..." : "Paused"}
          </span>
        </div>
      </div>

      {/* Duration selectors */}
      <div className="grid grid-cols-4 gap-1.5 w-full">
        {durations.map((d) => (
          <button
            key={d.value}
            onClick={() => setDuration(d.value)}
            className={`py-1 text-xs font-semibold rounded-lg transition-all ${
              duration === d.value
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Control Actions */}
      <div className="flex justify-center gap-3 w-full border-t border-slate-200/50 dark:border-slate-800/30 pt-3">
        <button
          onClick={toggleTimer}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-500/10"
              : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/10"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Start</span>
            </>
          )}
        </button>

        <button
          onClick={resetTimer}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200/40 dark:border-slate-800/40 transition-all"
          title="Reset Timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={playAlarmSound}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200/40 dark:border-slate-800/40 transition-all"
          title="Test Chime Sound"
        >
          <Volume2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}
