"use client";
import type { EventName } from "./events";

/** Fire-and-forget event; failures are ignored so analytics never break the experience. */
export function track(name: EventName, props: Record<string, string | number | undefined> = {}): void {
  try {
    const body = JSON.stringify({ name, props });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* ignore */
  }
}
