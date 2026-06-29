import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/50 dark:border-slate-800/40 bg-white dark:bg-[#0b0c16]/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          
          {/* Logo & Description */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-brand-600 text-white shadow-sm">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="font-bold text-base dark:text-white">
                English Buddy <span className="text-brand-500">Circle</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Practice speaking English with real people around the globe in seconds. Free, simple, and account-free.
            </p>
          </div>

          {/* Links grid */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="#" className="hover:text-brand-500 transition-colors">About</Link>
            <Link href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-brand-500 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-brand-500 transition-colors">Contact Support</Link>
          </div>

        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200/50 dark:bg-slate-800/40 my-6"></div>

        {/* Copyright & Info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            &copy; {currentYear} English Buddy Circle. All rights reserved. Built for global fluency.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500">
            <span>Powered by</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Jitsi Meet API</span>
            <span>&amp;</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Supabase</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
