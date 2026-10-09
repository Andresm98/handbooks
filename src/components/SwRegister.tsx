"use client";

import { useEffect } from "react";

/** Registra el service worker (modo offline) solo en producción. */
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* el modo offline es opcional */
    });
  }, []);
  return null;
}
