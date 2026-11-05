"use client";
import { useCallback, useEffect, useState } from "react";

/**
 * Per-tab session state for the Decision Clarity Canvas. Stored in sessionStorage only (cleared
 * when the tab closes), never sent to the server.
 */
const PREFIX = "sip-saathi:";

export function readSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession<T>(key: string, value: T | null) {
  try {
    if (value === null) sessionStorage.removeItem(PREFIX + key);
    else sessionStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: features still work for this page view */
  }
}

export function useSession<T>(key: string): [T | null, (v: T | null) => void, boolean] {
  const [v, setV] = useState<T | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setV(readSession<T>(key));
    setReady(true);
  }, [key]);
  const set = useCallback((x: T | null) => {
    setV(x);
    writeSession(key, x);
  }, [key]);
  return [v, set, ready];
}

export const SESSION_KEYS = { decode: "last-decode", journey: "journey", advice: "advice", reflections: "reflections" } as const;
