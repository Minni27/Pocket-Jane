"use client";

import { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

interface Props {
  onSnapshot: (dataUrl: string) => void;
  snapshot: string | null;
}

export default function CameraCapture({ onSnapshot, snapshot }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const [cameraError, setCameraError] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const capture = useCallback(() => {
    const dataUrl = webcamRef.current?.getScreenshot();
    if (dataUrl) onSnapshot(dataUrl);
  }, [onSnapshot]);

  if (snapshot) {
    return (
      <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
        <img src={snapshot} alt="Captured snapshot" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ border: "1px solid var(--border-accent)", borderRadius: "12px", boxShadow: "inset 0 0 40px rgba(0,0,0,0.2)" }} />
        <CornerBrackets />

        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--border-accent)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 4px var(--accent)" }} />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.06em" }}>CAPTURED</span>
        </div>

        <button
          onClick={() => onSnapshot("")}
          className="absolute top-3 right-3 rounded-md px-3 py-1.5"
          style={{
            background: "rgba(0,0,0,0.7)", border: "1px solid var(--border)",
            color: "var(--text-muted)", fontFamily: "var(--font-inter)",
            fontSize: "11px", cursor: "pointer", letterSpacing: "0.04em",
          }}
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/3", background: "var(--surface)", border: "1px solid var(--border)" }}>
      {!cameraError ? (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{ width: 640, height: 480, facingMode: "user" }}
            onUserMedia={() => setIsLive(true)}
            onUserMediaError={() => setCameraError(true)}
            className="w-full h-full object-cover"
          />

          {isLive && (
            <div className="absolute left-0 right-0 h-px pointer-events-none animate-scan" style={{ background: "linear-gradient(90deg, transparent, var(--accent), transparent)", opacity: 0.5 }} />
          )}

          <CornerBrackets />

          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md px-3 py-1.5" style={{ background: "rgba(0,0,0,0.7)", border: "1px solid var(--border-accent)" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)", boxShadow: "0 0 4px var(--accent)" }} />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.08em" }}>LIVE</span>
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
      <span style={{ fontSize: "32px", opacity: 0.3, color: "var(--text-muted)" }}>◎</span>
      <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "var(--text-muted)", textAlign: "center", maxWidth: "200px" }}>
        Camera access denied. Use the <strong style={{ color: "var(--accent)" }}>Describe</strong> mode instead.
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
