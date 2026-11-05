/**
 * AI provider configuration, read from server-side environment variables only.
 * Nothing here is ever sent to the browser except the booleans/labels returned by `aiStatus()`.
 */
export type AIProvider = "anthropic" | "gemini";

/** AI_PROVIDER wins; otherwise Gemini when its key is present, else Anthropic. */
export function aiProvider(): AIProvider {
  const p = process.env.AI_PROVIDER?.toLowerCase();
  if (p === "gemini" || p === "anthropic") return p;
  return process.env.GEMINI_API_KEY ? "gemini" : process.env.ANTHROPIC_API_KEY ? "anthropic" : "gemini";
}

export function modelId(): string {
  return aiProvider() === "gemini"
    ? process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"
    : process.env.ANTHROPIC_MODEL || "claude-opus-5-5";
}

export function effortLevel(): "low" | "medium" | "high" {
  const e = process.env.ANTHROPIC_EFFORT;
  return e === "medium" || e === "high" ? e : "low";
}

/** AI_MODE=demo forces educational demo mode even when a key is configured (useful for tests and quota-free deploys). */
export function forcedDemo(): boolean {
  return process.env.AI_MODE?.toLowerCase() === "demo";
}

/** The separate AI quality judge runs unless AI_JUDGE=off. */
export function judgeEnabled(): boolean {
  return process.env.AI_JUDGE?.toLowerCase() !== "off";
}
