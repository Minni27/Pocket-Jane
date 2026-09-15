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
        <img
          src={snapshot}
          alt="Captured snapshot"
          className="w-full h-full object-cover"
        />
        {/* Overlay frame */}
        <div
          className="absolute inset-0"
          style={{
            border: "1px solid rgba(192,38,63,0.3)",
            borderRadius: "12px",
            boxShadow: "inset 0 0 40px rgba(139,26,48,0.15)",
          }}
        />
        {/* Corner brackets */}
        <CornerBrackets color="#8b1a30" />

        {/* Tag */}
        <div
          className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md px-3 py-1.5"
          style={{ background: "rgba(7,6,10,0.8)", border: "1px solid rgba(139,26,48,0.3)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#c0263f", boxShadow: "0 0 4px #c0263f" }}
          />
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#b8af9a", letterSpacing: "0.06em" }}>
            CAPTURED
          </span>
        </div>

        {/* Retake button */}
        <button
          onClick={() => onSnapshot("")}
          className="absolute top-3 right-3 rounded-md px-3 py-1.5"
          style={{
            background: "rgba(7,6,10,0.8)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#b8af9a",
            fontFamily: "var(--font-inter)",
            fontSize: "11px",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          Retake
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        aspectRatio: "4/3",
        background: "rgba(15,14,20,0.8)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
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

          {/* Scan line */}
          {isLive && (
            <div
              className="absolute left-0 right-0 h-px pointer-events-none animate-scan"
              style={{
                background: "linear-gradient(90deg, transparent, rgba(192,38,63,0.5), transparent)",
                boxShadow: "0 0 6px rgba(192,38,63,0.3)",
              }}
            />
          )}

          {/* Corner brackets */}
          <CornerBrackets color={isLive ? "#8b1a30" : "#2a2030"} />

          {/* Live indicator */}
          {isLive && (
            <div
              className="absolute top-3 left-3 flex items-center gap-2 rounded-md px-3 py-1.5"
              style={{ background: "rgba(7,6,10,0.75)", border: "1px solid rgba(139,26,48,0.3)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#c0263f", boxShadow: "0 0 4px #c0263f" }}
              />
              <span style={{ fontFamily: "var(--font-inter)", fontSize: "11px", color: "#b8af9a", letterSpacing: "0.08em" }}>
                LIVE
              </span>
            </div>
          )}

          {/* Capture button */}
          <div className="absolute bottom-5 left-0 right-0 flex justify-center">
            <button
              onClick={capture}
              disabled={!isLive}
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "50%",
                background: isLive
                  ? "linear-gradient(135deg, #8b1a30, #5c0a17)"
                  : "rgba(255,255,255,0.05)",
                border: "3px solid rgba(240,234,216,0.15)",
                boxShadow: isLive ? "0 0 20px rgba(139,26,48,0.5)" : "none",
                cursor: isLive ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: isLive ? "#f0ead8" : "#2a2030",
                }}
              />
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
      <span style={{ fontSize: "32px", opacity: 0.3 }}>◎</span>
      <p style={{ fontFamily: "var(--font-inter)", fontSize: "13px", color: "#6e6860", textAlign: "center", maxWidth: "200px" }}>
        Camera access denied. Use the <strong style={{ color: "#8b1a30" }}>Describe</strong> mode instead.
      </p>
    </div>
  );
}

function CornerBrackets({ color }: { color: string }) {
  const style = {
    position: "absolute" as const,
    width: "20px",
    height: "20px",
    borderColor: color,
    borderStyle: "solid",
    transition: "border-color 0.4s ease",
  };
  return (
    <>
      <div style={{ ...style, top: "12px",  left: "12px",  borderWidth: "2px 0 0 2px" }} />
      <div style={{ ...style, top: "12px",  right: "12px", borderWidth: "2px 2px 0 0" }} />
      <div style={{ ...style, bottom: "12px", left: "12px",  borderWidth: "0 0 2px 2px" }} />
      <div style={{ ...style, bottom: "12px", right: "12px", borderWidth: "0 2px 2px 0" }} />
    </>
  );
}
