import "server-only";

/**
 * Privacy-safe diagnostics. Only enumerated labels, ids and timings are logged: never user text,
 * amounts, identifiers or model output. Values are coerced to short primitives as a backstop.
 */
type Primitive = string | number | boolean | null;

function sanitize(v: unknown): Primitive | Primitive[] {
  if (Array.isArray(v)) return v.slice(0, 20).map((x) => sanitize(x) as Primitive);
  if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
  return String(v).replace(/\d{6,}/g, "#").slice(0, 120);
}

export async function logDiagnostic(event: string, fields: Record<string, unknown>): Promise<void> {
  if (process.env.NODE_ENV === "test" || process.env.VITEST || process.env.SIP_SAATHI_QUIET) return;
  const safe = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, sanitize(v)]));
  console.info(JSON.stringify({ app: "sip-saathi", event, at: new Date().toISOString(), ...safe }));
}
