"use client";

import { useEffect } from "react";

// BUILD_ID is replaced at build time by Next.js — ensures the browser fetches
// a fresh sw.js on every deploy, which triggers the activate event and busts old caches.
const BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`/sw.js?v=${BUILD_ID}`, { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    }
  }, []);

  return null;
}
