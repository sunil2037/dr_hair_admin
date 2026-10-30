"use client";

import { useEffect, useState } from "react";

/** Keeps prototype-only edits across panel navigation and refreshes in this browser session. */
export function useSessionState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let storedValue: T | undefined;
    let hasStoredValue = false;
    try {
      const stored = window.sessionStorage.getItem(key);
      if (stored !== null) {
        storedValue = JSON.parse(stored) as T;
        hasStoredValue = true;
      }
    } catch {
      // Ignore inaccessible or malformed session storage.
    }
    const timer = window.setTimeout(() => {
      if (hasStoredValue) setValue(storedValue as T);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The UI remains usable if browser storage is unavailable or full.
    }
  }, [key, ready, value]);

  return [value, setValue] as const;
}
