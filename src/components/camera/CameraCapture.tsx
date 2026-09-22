"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Icon } from "@/components/ui";

interface Props {
  onSnapshot: (dataUrl: string) => void;
  snapshot: string | null;
}

export default function CameraCapture({ onSnapshot, snapshot }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isLive, setIsLive] = useState(false);

  // Point at the subject, not at yourself. Phones get the rear camera;
  // laptops only have a front one, so they keep it.
  const [facing, setFacing] = useState<"user" | "environment">(
    typeof navigator !== "undefined" &&
    /iphone|ipad|android|mobile/i.test(navigator.userAgent)
      ? "environment"
      : "user"
  );
  const [hasMultiple, setHasMultiple] = useState(false);

  useEffect(() => {
    // enumerateDevices only labels cameras after permission is granted, so
    // count them once the stream is live rather than on mount.
    if (!isLive || !navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices()
      .then((d) => setHasMultiple(d.filter((x) => x.kind === "videoinput").length > 1))
      .catch(() => {});
  }, [isLive]);

  const flip = useCallback(() => {
    setIsLive(false); // stream restarts on constraint change
    setFacing((f) => (f === "user" ? "environment" : "user"));
  }, []);

  const capture = useCallback(() => {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (dataUrl) onSnapshot(dataUrl);
  }, [onSnapshot]);

  if (snapshot) {
    return (
      <div className="relative overflow-hidden"  style={{ aspectRatio: "3/2", borderRadius: "var(--r-card)" }}>
        <img src={snapshot} alt="Captured snapshot" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ border: "1px solid var(--border-accent)", borderRadius: "var(--r-card)", boxShadow: "inset 0 0 40px rgba(0,0,0,0.2)" }} />
        <CornerBrackets />

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--border-accent)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 4px var(--accent)" }} />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", color: "var(--text-dim)", letterSpacing: "0.06em" }}>CAPTURED</span>
        </div>

        <button
          onClick={() => onSnapshot("")}
          className="absolute top-3 right-3 rounded-md px-3 py-1.5"
          style={{
            background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)",
            color: "var(--text-muted)", fontFamily: "var(--font-inter)",
            fontSize: "var(--t-meta)", cursor: "pointer", letterSpacing: "0.04em",
          }}
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden"  style={{ aspectRatio: "3/2", borderRadius: "var(--r-card)", background: "var(--surface)", border: "1px solid var(--border)" }}>
      {!cameraError ? (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{
              width:  { ideal: 1280, max: 1920 },
              height: { ideal: 960,  max: 1440 },
              facingMode: facing,
            }}
            onUserMedia={() => setIsLive(true)}
            onUserMediaError={() => {
              // A device with no rear camera rejects facingMode:"environment";
              // drop back to the front one instead of showing an error.
              if (facing === "environment") { setFacing("user"); return; }
              setCameraError(true);
            }}
            className="w-full h-full object-cover"
          />

          {isLive && (
            <div className="absolute left-0 right-0 h-px pointer-events-none animate-scan" style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.5 }} />
          )}

          <CornerBrackets />

          {hasMultiple && (
            <button
              onClick={flip}
              title={facing === "environment" ? "Switch to front camera" : "Switch to rear camera"}
              className="absolute top-3 right-3 rounded-md"
              style={{
                width: "34px", height: "34px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.7)", border: "1px solid var(--border-accent)",
                color: "var(--text-dim)", cursor: "pointer", padding: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H7a2 2 0 00-2 2v9"/>
                <polyline points="8 1 11 4 8 7"/>
                <path d="M13 20h4a2 2 0 002-2V9"/>
                <polyline points="16 23 13 20 16 17"/>
              </svg>
            </button>
          )}

          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--border-accent)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)", boxShadow: "0 0 4px var(--accent)" }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "var(--t-meta)", color: "var(--text-dim)", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
          )}

          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <button
              onClick={capture}
              disabled={!isLive}
              style={{
                width: "60px", height: "60px", borderRadius: "50%",
                background: isLive ? "var(--accent)" : "var(--raised)",
                border: "3px solid var(--border)",
                boxShadow: isLive ? "var(--shadow-glow)" : "none",
                cursor: isLive ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: isLive ? "#fff" : "var(--text-ghost)" }} />
            </button>
          </div>
        </>
      ) : (
        <CameraError />
      )}
    </div>
  );
}

function CameraError() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <Icon name="camera" size={30} style={{ opacity: 0.35, color: "var(--text-muted)" }} />
      <p style={{ fontFamily: "var(--font-inter)", fontSize: "var(--t-ui)", color: "var(--text-muted)", textAlign: "center", maxWidth: "200px" }}>
        Camera access denied. Use the <strong style={{ color: "var(--accent-text)" }}>Describe</strong> mode instead.
      </p>
    </div>
  );
}

function CornerBrackets() {
  const base: React.CSSProperties = { position: "absolute", width: "20px", height: "20px", borderColor: "var(--accent)", borderStyle: "solid", opacity: 0.6, transition: "border-color 0.4s ease" };
  return (
    <>
      <div style={{ ...base, top: "12px",    left: "12px",   borderWidth: "2px 0 0 2px" }} />
      <div style={{ ...base, top: "12px",    right: "12px",  borderWidth: "2px 2px 0 0" }} />
      <div style={{ ...base, bottom: "12px", left: "12px",   borderWidth: "0 0 2px 2px" }} />
      <div style={{ ...base, bottom: "12px", right: "12px",  borderWidth: "0 2px 2px 0" }} />
    </>
  );
}
