import "server-only";
import { getStore, KEYS } from "../store";
import { COUNTED_PROPS, EVENT_SCHEMAS, type EventName } from "./events";

export async function recordEvent(name: EventName, props: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = EVENT_SCHEMAS[name].strict().safeParse(props);
  if (!parsed.success) return { ok: false, error: "Invalid event properties." };
  const store = getStore();
  const day = new Date().toISOString().slice(0, 10);
  const data = parsed.data as Record<string, unknown>;
  const ops: Promise<unknown>[] = [store.hincr(KEYS.eventCounts, name), store.hincr(KEYS.eventDaily(day), name)];
  for (const prop of COUNTED_PROPS[name] ?? []) {
    if (data[prop] !== undefined) ops.push(store.hincr(KEYS.eventCounts, `${name}|${prop}=${String(data[prop])}`));
  }
  await Promise.all(ops);
  return { ok: true };
}

export async function readEventCounts(): Promise<Record<string, number>> {
  const raw = await getStore().hgetall<number | string>(KEYS.eventCounts);
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v) || 0]));
}
