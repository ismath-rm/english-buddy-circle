import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "English Buddy Circle - Practice Spoken English with Partners",
  description: "An instant, real-time English speaking community where you can find practice partners, join conversation rooms, or host your own rooms in under 10 seconds. No registration required.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Load Jitsi External API globally for instant call loads */}
        <script src="https://meet.ffmuc.net/external_api.js" defer></script>
      </head>
      <body className={`${outfit.variable} font-sans antialiased text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-[#0b0c16]`}>
        {/* Visual premium background glows */}
        <div className="relative min-h-screen overflow-hidden">
          <div className="bg-glow-blur w-[40vw] h-[40vw] bg-purple-600/10 dark:bg-purple-600/15 top-[-10%] left-[-10%]"></div>
          <div className="bg-glow-blur w-[50vw] h-[50vw] bg-blue-600/10 dark:bg-indigo-600/10 bottom-[-20%] right-[-10%]"></div>
          <div className="relative z-10 flex flex-col min-h-screen">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
