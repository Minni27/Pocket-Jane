"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Registered after load so it never competes with the first paint
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // An unavailable service worker only costs installability,
        // so a failure here should never surface to the user.
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
