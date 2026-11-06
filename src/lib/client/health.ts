"use client";
import { useEffect, useState } from "react";

export interface Health {
  mode: "live" | "demo";
  demoReason: "no_key" | "forced_demo" | null;
  provider: string | null;
  model: string | null;
  judge: boolean;
  quotaPausedUntil: string | null;
  storage: { mode: "redis" | "file" | "memory"; persistent: boolean };
  versions: { prompt: string; kb: string; policy: string };
}

let cache: Promise<Health | null> | null = null;

export function fetchHealth(): Promise<Health | null> {
  cache ??= fetch("/api/health", { cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<Health>) : null))
    .catch(() => null);
  return cache;
}

export function useHealth(): Health | null {
  const [h, setH] = useState<Health | null>(null);
  useEffect(() => {
    let alive = true;
    void fetchHealth().then((x) => alive && setH(x));
    return () => {
      alive = false;
    };
  }, []);
  return h;
}
