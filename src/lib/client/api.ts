"use client";
import type { AdviceResult, ConcernCategory, DecodeResult } from "../types";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function post<T>(url: string, body: unknown, headers: Record<string, string> = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });
  } catch {
    throw new ApiError("Could not reach SIP Saathi. Check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data) throw new ApiError(data?.error ?? `Something went wrong (${res.status}). Please try again.`, res.status);
  return data;
}

export const api = {
  decode: (b: { text?: string; category?: ConcernCategory; scenarioId?: "A" | "A-unsafe" | "B" | "C" | "E" }) => post<DecodeResult>("/api/decode", b),
  advice: (statements: string[]) => post<AdviceResult>("/api/advice", { statements }),
  post,
};
