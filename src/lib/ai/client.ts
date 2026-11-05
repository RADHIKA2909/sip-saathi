import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { ApiError as GeminiApiError, GoogleGenAI } from "@google/genai";
import { aiProvider, effortLevel, forcedDemo, modelId } from "./config";
import { AIQuotaError, getCooldown, nextPacificMidnight, parseRateLimit, setCooldown } from "./quota";

const RETRYABLE = new Set([429, 500, 503]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

let anthropic: Anthropic | null = null;
let gemini: GoogleGenAI | null = null;

function apiKey(): string | undefined {
  return aiProvider() === "gemini" ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
}

export function aiConfigured(): boolean {
  return Boolean(apiKey());
}

/** True when live generation should be attempted. */
export function liveAIEnabled(): boolean {
  return aiConfigured() && !forcedDemo();
}

export class AIUnavailableError extends Error {}

function requireKey(): string {
  const key = apiKey();
  if (!key) throw new AIUnavailableError("Live AI is not enabled on this deployment.");
  return key;
}

export interface StructuredResult<T> {
  data: T;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

interface StructuredRequest {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  maxTokens?: number;
}

function parseJson<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Model returned output that is not valid JSON.");
  }
}

/** The system prompt is marked cacheable because it is identical across every record in a run. */
async function callAnthropic<T>(opts: StructuredRequest): Promise<StructuredResult<T>> {
  anthropic ??= new Anthropic({ apiKey: requireKey(), maxRetries: 1, timeout: 40_000 });
  const res = await anthropic.beta.messages.create({
    model: modelId(),
    max_tokens: opts.maxTokens ?? 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: opts.user }],
    output_config: { effort: effortLevel(), format: { type: "json_schema", schema: opts.schema } },
  });
  if (res.stop_reason === "refusal") {
    throw new Error(`Model declined the request${res.stop_details?.category ? ` (${res.stop_details.category})` : ""}.`);
  }
  if (res.stop_reason === "max_tokens") throw new Error("Model output was cut off (max_tokens reached).");
  const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  return {
    data: parseJson<T>(text),
    model: res.model,
    usage: { inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens },
  };
}

// Free Gemini tiers allow only a few requests per minute, so calls are spaced out per server
// instance (GEMINI_RPM, default 10) and retried after the delay the API asks for.
const GEMINI_MAX_IN_FLIGHT = Math.max(1, Number(process.env.GEMINI_CONCURRENCY) || 2);
const GEMINI_INTERVAL_MS = 60_000 / Math.max(1, Number(process.env.GEMINI_RPM) || 10);
let geminiInFlight = 0;
const geminiQueue: (() => void)[] = [];
let nextGeminiStart = 0;

async function withGeminiSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (geminiInFlight >= GEMINI_MAX_IN_FLIGHT) await new Promise<void>((r) => geminiQueue.push(r));
  geminiInFlight++;
  try {
    const start = Math.max(Date.now(), nextGeminiStart);
    nextGeminiStart = start + GEMINI_INTERVAL_MS;
    await sleep(start - Date.now());
    return await fn();
  } finally {
    geminiInFlight--;
    geminiQueue.shift()?.();
  }
}


async function callGemini<T>(opts: StructuredRequest): Promise<StructuredResult<T>> {
  gemini ??= new GoogleGenAI({ apiKey: requireKey(), httpOptions: { timeout: 40_000 } });
  const client = gemini;
  const model = modelId();
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await withGeminiSlot(() =>
        client.models.generateContent({
          model,
          contents: opts.user,
          config: {
            systemInstruction: opts.system,
            responseMimeType: "application/json",
            responseJsonSchema: opts.schema,
            maxOutputTokens: opts.maxTokens ?? 16000,
          },
        }),
      );
      if (res.promptFeedback?.blockReason) throw new Error(`Model declined the request (${res.promptFeedback.blockReason}).`);
      const finish = res.candidates?.[0]?.finishReason;
      if (finish === "MAX_TOKENS") throw new Error("Model output was cut off (max tokens reached).");
      if (finish && finish !== "STOP") throw new Error(`Model stopped without a usable answer (${finish}).`);
      return {
        data: parseJson<T>(res.text ?? ""),
        model: res.modelVersion ?? model,
        usage: {
          inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0,
        },
      };
    } catch (e) {
      if (!(e instanceof GeminiApiError) || !RETRYABLE.has(e.status)) throw e;
      const backoff = 1500 * (attempt + 1);
      if (e.status === 429) {
        const { daily, retryDelayMs } = parseRateLimit(e.message);
        if (daily) throw new AIQuotaError(await setCooldown(nextPacificMidnight()));
        const wait = retryDelayMs ?? Math.max(backoff, 20_000);
        if (attempt >= 1 || wait > 15_000) throw new AIQuotaError(await setCooldown(new Date(Date.now() + Math.max(wait, 60_000))));
        await sleep(wait + 500);
      } else {
        if (attempt >= 2) throw e; // Gemini 503s ("high demand") are usually brief, so allow three attempts.
        await sleep(backoff);
      }
    }
  }
}

/** One request with a JSON-schema-constrained response, sent to the configured provider. */
export async function callStructured<T>(opts: StructuredRequest): Promise<StructuredResult<T>> {
  if (aiProvider() === "anthropic") return callAnthropic<T>(opts);
  const paused = await getCooldown();
  if (paused) throw new AIQuotaError(paused);
  return callGemini<T>(opts);
}

export function describeError(e: unknown): string {
  if (e instanceof AIUnavailableError || e instanceof AIQuotaError) return e.message;
  if (e instanceof Anthropic.AuthenticationError) return "The AI provider rejected the API key (401).";
  if (e instanceof Anthropic.RateLimitError) return "AI provider rate limit reached (429). Try again shortly.";
  if (e instanceof Anthropic.APIError) return `Anthropic API error ${e.status ?? ""}: ${e.message}`;
  if (e instanceof GeminiApiError) {
    if (e.status === 400 && /api key/i.test(e.message)) return "Gemini rejected the API key. Check GEMINI_API_KEY.";
    return `Gemini API error ${e.status}: ${e.message.slice(0, 300)}`;
  }
  return e instanceof Error ? e.message : String(e);
}
