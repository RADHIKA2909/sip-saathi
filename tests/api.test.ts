import { describe, expect, it } from "vitest";
import { POST as decode } from "@/app/api/decode/route";
import { POST as advice } from "@/app/api/advice/route";
import { POST as events } from "@/app/api/events/route";
import { GET as health } from "@/app/api/health/route";
import { POST as evalPost } from "@/app/api/eval/route";
import { DecodeEnvelopeSchema, AdviceEnvelopeSchema } from "@/eval/runner";

process.env.VERCEL = "1"; // use the in-memory store so tests never write files

const post = (url: string, body: unknown, ip = "10.0.0.1") =>
  new Request(`http://localhost${url}`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: typeof body === "string" ? body : JSON.stringify(body) });

describe("API routes", () => {
  it("POST /api/decode returns a schema-valid envelope for each scenario", async () => {
    for (const scenarioId of ["A", "A-unsafe", "B", "C"]) {
      const res = await decode(post("/api/decode", { scenarioId }, `10.1.0.${scenarioId.length}`));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(DecodeEnvelopeSchema.safeParse(body).success).toBe(true);
    }
  });
  it("scenario paths differ", async () => {
    const cats = [];
    for (const s of ["A", "B", "C"]) cats.push((await (await decode(post("/api/decode", { scenarioId: s }, "10.2.0.1"))).json()).category);
    expect(cats).toEqual(["negative_returns", "small_contributions", "payment_failure"]);
    const unsafe = await (await decode(post("/api/decode", { scenarioId: "A-unsafe" }, "10.2.0.2"))).json();
    expect(unsafe.mode).toBe("fallback");
  });
  it("returns the masked concern, but never echoes routed messages", async () => {
    const example = await (await decode(post("/api/decode", { scenarioId: "E" }, "10.5.0.1"))).json();
    expect(example.category).toBe("negative_returns");
    expect(example.concernText).toMatch(/running for six months/);
    const masked = await (await decode(post("/api/decode", { text: "My autopay failed, account 123456789012" }, "10.5.0.2"))).json();
    expect(masked.concernText).not.toContain("123456789012");
    const routed = await (await decode(post("/api/decode", { text: "I want to end my life" }, "10.5.0.3"))).json();
    expect(routed.concernText).toBeUndefined();
  });
  it("rejects bad input with a helpful 400", async () => {
    expect((await decode(post("/api/decode", "not json"))).status).toBe(400);
    expect((await decode(post("/api/decode", { text: "x".repeat(700) }))).status).toBe(400);
    expect((await decode(post("/api/decode", {}))).status).toBe(400);
  });
  it("rate limits", async () => {
    let last = 200;
    for (let i = 0; i < 14; i++) last = (await decode(post("/api/decode", { category: "general_knowledge" }, "10.9.9.9"))).status;
    expect(last).toBe(429);
  });
  it("POST /api/advice validates and labels", async () => {
    const res = await advice(post("/api/advice", { statements: ["SIPs are guaranteed to double.", "I think SIPs are boring."] }, "10.3.0.1"));
    const body = await res.json();
    expect(AdviceEnvelopeSchema.safeParse(body).success).toBe(true);
    expect(body.items.map((i: { kind: string }) => i.kind)).toEqual(["unsupported_claim", "opinion"]);
    expect((await advice(post("/api/advice", { statements: [] }, "10.3.0.2"))).status).toBe(400);
  });
  it("POST /api/events accepts allowlisted events only", async () => {
    expect((await events(post("/api/events", { name: "concern_selected", props: { category: "negative_returns", via: "chip" } }))).status).toBe(200);
    expect((await events(post("/api/events", { name: "concern_selected", props: { category: "negative_returns", via: "chip", text: "my PAN" } }))).status).toBe(400);
    expect((await events(post("/api/events", { name: "made_up", props: {} }))).status).toBe(400);
  });
  it("GET /api/health never exposes keys", async () => {
    const body = await (await health()).json();
    expect(JSON.stringify(body)).not.toMatch(/AIza|sk-ant|GEMINI_API_KEY|ANTHROPIC_API_KEY/);
    expect(body.mode).toBe("demo");
  });
  it("POST /api/eval runs a full cycle with no credentials", async () => {
    const ip = "10.4.0.1";
    const started = await (await evalPost(post("/api/eval", { action: "start" }, ip))).json();
    expect(started.mode).toBe("demo");
    const c = await evalPost(post("/api/eval", { action: "case", runId: started.runId, caseId: "MVP-01" }, ip));
    expect(c.status).toBe(200);
    expect((await evalPost(post("/api/eval", { action: "finish", runId: started.runId }, ip))).status).toBe(200);
  });
  it("POST /api/eval recovers when another instance holds the run", async () => {
    const res = await evalPost(post("/api/eval", { action: "case", runId: "6f1f3f5e-3c1a-4b7e-9a55-0d5a0a3a1b11", caseId: "MVP-02" }, "10.4.0.2"));
    expect(res.status).toBe(200);
  });
  it("limits how many runs one client can start", async () => {
    let last = 200;
    for (let i = 0; i < 7; i++) last = (await evalPost(post("/api/eval", { action: "start" }, "10.4.0.3"))).status;
    expect(last).toBe(429);
  });
});
