"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface JitsiMeetingProps {
  roomId: string;
  userName: string;
  onLeave: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

export default function JitsiMeeting({ roomId, userName, onLeave }: JitsiMeetingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    let scriptTimeout: NodeJS.Timeout;
    
    const initJitsi = () => {
      if (!containerRef.current) return;
      
      // Ensure the container is empty before creating the iframe
      containerRef.current.innerHTML = "";
      
      try {
        // Unique room name prefix to avoid collision on the public Jitsi server
        const uniqueRoomName = `ebc-speaking-room-${roomId}`;
        
        const domain = "jitsi.belnet.be";
        const options = {
          roomName: uniqueRoomName,
          width: "100%",
          height: "100%",
          parentNode: containerRef.current,
          userInfo: {
            displayName: userName
          },
          configOverwrite: {
            // Standard performance & UI overrides
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            startAudioOnly: false, // Enable video/cameras
            prejoinConfig: {
              enabled: false
            },
            prejoinPageEnabled: false, // Skip Jitsi prejoin since user entered details already
            disableDeepLinking: true,  // Prevent mobile redirect prompts
            mobileAppPromo: false,     // Disable Jitsi Meet app download promo banner on mobile
            hideWatermark: true,       // Hide Jitsi watermark/logos in the conference
            logoImageUrl: "",          // Remove logo image URL
            logoClickUrl: "",          // Remove logo click redirect
            brandShowName: false,      // Hide brand name text
            favicon: "/favicon.ico",   // Override favicon to preserve site icon
            disableInviteFunctions: true, // Disable Jitsi default invite overlay (we use our own)
            toolbarButtons: [
              "microphone",
              "camera",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "raisehand",
              "tileview",
              "chat",
              "participants-pane",
              "settings",
              "profile"
            ],
            // Enable screensharing, recording off
            localRecording: { enabled: false }
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            JITSI_WATERMARK_LINK: "",
            BRAND_WATERMARK_LINK: "",
            DEFAULT_BACKGROUND: "#131526",
            DEFAULT_LOCAL_DISPLAY_NAME: userName
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;
        setStatus("ready");

        // Event listeners
        api.addEventListener("readyToClose", () => {
          console.log("Jitsi: User closed conference");
          onLeave();
        });

        api.addEventListener("videoConferenceLeft", () => {
          console.log("Jitsi: User left conference");
          onLeave();
        });

        api.addEventListener("chatUpdated", (data: any) => {
          console.log("Jitsi: Chat updated:", data.isOpen);
          setIsChatOpen(data.isOpen);
        });

        api.addEventListener("toolbarButtonClicked", (data: any) => {
          console.log("Jitsi: Toolbar button clicked:", data.name);
          if (data.name === "chat") {
            setIsChatOpen((prev) => !prev);
          }
        });

      } catch (err) {
        console.error("Failed to initialize Jitsi API:", err);
        setStatus("error");
      }
    };

    const checkAndLoadJitsi = () => {
      if (window.JitsiMeetExternalAPI) {
        initJitsi();
      } else {
        // Dynamically insert script if not loaded yet
        const script = document.createElement("script");
        script.src = "https://jitsi.belnet.be/external_api.js";
        script.async = true;
        script.onload = () => initJitsi();
        script.onerror = () => setStatus("error");
        document.head.appendChild(script);

        // Fail-safe timeout
        scriptTimeout = setTimeout(() => {
          if (!window.JitsiMeetExternalAPI) {
            setStatus("error");
          }
        }, 10000);
      }
    };

    checkAndLoadJitsi();

    return () => {
      if (scriptTimeout) clearTimeout(scriptTimeout);
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [roomId, userName, onLeave]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-900">
      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900 z-10">
          <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          <span className="text-sm font-medium text-slate-400">Loading live conversation session...</span>
        </div>
      )}

      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900 z-10 px-4 text-center">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <div>
            <h3 className="font-bold text-lg text-white">Connection Failed</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              We couldn't connect to Jitsi server. Check your network connection or try reload the page.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-brand-500/10"
          >
            Reload Page
          </button>
        </div>
      )}

      {/* Transparent Jitsi watermark click blocker overlay */}
      <div 
        className="absolute top-0 w-32 h-14 bg-transparent pointer-events-auto z-10"
        style={{ left: isChatOpen ? "375px" : "0px" }}
      />

      {/* Prevent text selection and iOS link/image long-press context menus */}
      <style>{`
        #jitsi-iframe-container iframe {
          -webkit-touch-callout: none !important;
          -webkit-user-select: none !important;
          user-select: none !important;
        }
      `}</style>

      {/* Jitsi iframe mount point */}
      <div id="jitsi-iframe-container" ref={containerRef} className="w-full h-full jitsi-container" />
    </div>
  );
}
