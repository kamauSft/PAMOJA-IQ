"use client";

import { useEffect } from "react";

/** Drop any old offline worker left by a previous experiment. Development never keeps one. */
export function DevCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    if ("caches" in window) {
      void caches.keys().then((keys) => {
        for (const key of keys) void caches.delete(key);
      });
    }
  }, []);
  return null;
}
