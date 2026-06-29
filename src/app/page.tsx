import Link from "next/link";
import { MessageSquare, Shield, Smartphone, Globe, Sparkles, Users, Award, Play } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LandingPage() {
  
  const features = [
    {
      icon: <Globe className="w-5 h-5 text-brand-500" />,
      title: "Practice with Real People",
      description: "Connect with English learners and speakers globally. Practice natural conversations, dialects, and slang."
    },
    {
      icon: <Shield className="w-5 h-5 text-brand-500" />,
      title: "No Account Required",
      description: "No signups, logins, or social logins. Jump straight into calls anonymously to protect your data privacy."
    },
    {
      icon: <Sparkles className="w-5 h-5 text-brand-500" />,
      title: "100% Free Forever",
      description: "Zero cost. No monthly trials or subscriptions. Fully decentralized peer communication using built-in browser APIs."
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-brand-500" />,
      title: "Live Room Chats",
      description: "Send text, helpful vocabulary, and emojis. Text chat syncs instantly via Supabase web socket replication."
    },
    {
      icon: <Users className="w-5 h-5 text-brand-500" />,
      title: "Instant Room Setup",
      description: "Setup target levels, topic tags, and speaker limits. Secure private rooms with passwords for private tutor circles."
    },
    {
      icon: <Smartphone className="w-5 h-5 text-brand-500" />,
      title: "Mobile Friendly",
      description: "Fully responsive. Join meetings, unmute, and participate in conversations from any mobile browser or tablet."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Visit Website",
      description: "Navigate to the English Buddy Circle landing page on any device."
    },
    {
      num: "02",
      title: "Explore Rooms",
      description: "Filter active meetings by difficulty (Beginner/Advanced) or category (IELTS/Business)."
    },
    {
      num: "03",
      title: "Join or Create",
      description: "Click Join on any active card, or create a custom topic room in seconds."
    },
    {
      num: "04",
      title: "Start Speaking",
      description: "Enter your display name, unmute your mic, and practice English immediately!"
    }
  ];

  return (
    <>
      <Navbar />

      <main className="flex-grow flex flex-col">
        
        {/* HERO SECTION */}
        <section className="relative py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Column: Heading Copy */}
          <div className="flex-grow max-w-2xl text-center lg:text-left flex flex-col gap-6">
            
            {/* Launch tag */}
            <div className="inline-flex items-center gap-1.5 self-center lg:self-start px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-200/40 dark:border-brand-500/20">
              <Award className="w-3.5 h-3.5" />
              <span>Free real-time English community</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Practice English with <br />
              <span className="bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Real People.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0">
              Join live speaking rooms and improve your fluency through real-time audio conversations. No signups, no fees, no hassle.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-2">
              <Link
                href="/rooms"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-base bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20 hover:shadow-brand-500/35 transition-all text-center"
              >
                Join a Room
              </Link>
              <Link
                href="/rooms?create=true"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-base bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all text-center"
              >
                Create a Room
              </Link>
            </div>

            {/* Micro stats banner */}
            <div className="flex items-center justify-center lg:justify-start gap-6 mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                <span>Account Free</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Embedded Voice calls</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                <span>Active 24/7</span>
              </div>
            </div>

          </div>

          {/* Right Column: Premium CSS illustration grid representing conversation partners */}
          <div className="relative w-full max-w-md lg:max-w-lg aspect-square shrink-0 flex items-center justify-center">
            
            {/* Visual glow circles */}
            <div className="absolute w-72 h-72 rounded-full bg-brand-500/5 animate-pulse-slow"></div>
            <div className="absolute w-48 h-48 rounded-full border border-dashed border-brand-500/20 animate-spin" style={{ animationDuration: '60s' }}></div>

            {/* Speaking Circles Widget Representation */}
            <div className="relative w-80 h-80 rounded-3xl glass-card flex flex-col justify-between p-6 shadow-2xl animate-float-slow border border-slate-200/50 dark:border-slate-800/40">
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Active Call</span>
                </div>
                <span className="text-xs font-bold text-slate-400">ebc-room-284a</span>
              </div>

              {/* Avatar speaking representation */}
              <div className="flex justify-center items-center gap-4 my-4">
                
                {/* Speaker A */}
                <div className="relative flex flex-col items-center">
                  <div className="relative w-16 h-16 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl border-4 border-slate-50 dark:border-[#131526] z-10">
                    S
                  </div>
                  {/* Glowing voice waves */}
                  <div className="absolute inset-0 rounded-full bg-brand-500/40 speaking-ring"></div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">Sarah (Host)</span>
                </div>

                <div className="flex flex-col items-center text-slate-300 dark:text-slate-600">
                  <Play className="w-4 h-4 transform rotate-90 text-brand-500" />
                  <span className="text-[10px] font-mono mt-1 text-slate-400">P2P Link</span>
                </div>

                {/* Speaker B */}
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-rose-600 to-orange-600 text-white flex items-center justify-center font-bold text-xl border-4 border-slate-50 dark:border-[#131526]">
                    M
                  </div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">Miguel</span>
                </div>

              </div>

              {/* Real-time speaking subtitle simulation */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/40 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                  &ldquo;I want to practice IELTS cue cards...&rdquo;
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* FEATURES GRID */}
        <section className="py-16 md:py-24 bg-white dark:bg-slate-900/25 border-y border-slate-200/40 dark:border-slate-800/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Everything you need to practice.
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                A simple, powerful, and robust feature set designed for comfortable speaking practice.
              </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="p-6 rounded-2xl glass-card hover:border-brand-500/20 transition-all">
                  <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-brand-500/10 w-fit mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-base text-slate-950 dark:text-white mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Start Speaking in 4 Steps
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              No complicated configurations. Open, click, and talk.
            </p>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative p-6 rounded-2xl glass-card flex flex-col justify-between min-h-[160px] group hover:border-brand-500/20 transition-all">
                <span className="text-3xl font-black text-brand-500/15 dark:text-brand-400/10 group-hover:text-brand-500/30 transition-colors absolute top-4 right-6">
                  {s.num}
                </span>
                <div className="mt-6">
                  <h3 className="font-bold text-base text-slate-950 dark:text-white mb-1">{s.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prompt banner CTA */}
          <div className="mt-16 p-8 rounded-3xl bg-gradient-to-tr from-brand-600/10 to-indigo-600/10 border border-brand-500/10 dark:border-brand-500/20 text-center max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h3 className="font-bold text-lg dark:text-white leading-tight">Ready to improve your English?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">English speakers are online waiting for you.</p>
            </div>
            <Link
              href="/rooms"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10 hover:shadow-brand-500/25 transition-all text-center"
            >
              Start Practicing Now
            </Link>
          </div>

        </section>

      </main>

      <Footer />
    </>
  );
}
