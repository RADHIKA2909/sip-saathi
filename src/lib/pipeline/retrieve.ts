import { PASSAGES, PASSAGE_BY_ID, type Passage, type Topic } from "@/content/kb/passages";
import { SOURCE_BY_ID } from "@/content/kb/sources";
import type { ConcernCategory, ResolvedReference } from "../types";

/** Topics each category draws from, most important first. */
export const CATEGORY_TOPICS: Record<ConcernCategory, Topic[]> = {
  negative_returns: ["market_value", "risk", "volatility", "rupee_cost_averaging", "time_horizon"],
  small_contributions: ["small_amounts", "sip_basics", "time_horizon", "financial_planning"],
  conflicting_information: ["misinformation", "risk"],
  payment_failure: ["missed_instalment", "cancellation", "mandate", "grievance"],
  affordability: ["affordability", "financial_planning", "missed_instalment", "redemption"],
  general_knowledge: ["sip_basics", "nav", "risk"],
  out_of_scope: ["misinformation", "sip_basics"],
};

/** Passages always included for a category, so the most relevant source is never crowded out. */
const PINNED: Partial<Record<ConcernCategory, string[]>> = {
  negative_returns: ["amfi-guide-risks", "amfi-guide-units-at-nav"],
  small_contributions: ["sebi-booklet-sip", "amfi-guide-goal-based"],
  conflicting_information: ["amfi-guide-fraud-warnings", "sebi-booklet-donts"],
  payment_failure: ["mfsh-missed-payments", "amfi-sebi-cessation-rule"],
  affordability: ["sebi-booklet-financial-situation", "mfsh-missed-payments"],
};

const STOP = new Set("a an the and or of to in on for is are was were be been my i me it this that with at by from as your you what how why do does did can should will not no".split(" "));

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}

export const MAX_PASSAGES = 4;

/** Deterministic selection: pinned passages, then topic match weighted by order, then keyword overlap. */
export function retrieve(category: ConcernCategory, text: string, max = MAX_PASSAGES): Passage[] {
  const topics = CATEGORY_TOPICS[category];
  const q = tokens(text);
  const pinned = (PINNED[category] ?? []).map((id) => PASSAGE_BY_ID.get(id)).filter((p): p is Passage => Boolean(p));
  const scored = PASSAGES.filter((p) => !pinned.includes(p) && p.topics.some((t) => topics.includes(t)) && !p.topics.includes("wellbeing"))
    .map((p) => {
      const topicScore = p.topics.reduce((acc, t) => acc + (topics.includes(t) ? topics.length - topics.indexOf(t) : 0), 0);
      let overlap = 0;
      for (const w of tokens(p.text)) if (q.has(w)) overlap++;
      return { p, score: topicScore + overlap * 2 };
    })
    .sort((a, b) => b.score - a.score || a.p.contentId.localeCompare(b.p.contentId));
  return [...pinned, ...scored.map((s) => s.p)].slice(0, max);
}

export function resolveReference(contentId: string): ResolvedReference | null {
  const p = PASSAGE_BY_ID.get(contentId);
  if (!p) return null;
  const s = SOURCE_BY_ID.get(p.sourceId);
  if (!s) return null;
  return {
    contentId: p.contentId,
    sourceId: s.id,
    sourceTitle: s.title,
    publisher: s.publisher,
    url: s.url,
    published: s.published,
    retrieved: s.retrieved,
    locator: p.locator,
    passage: p.text,
  };
}

export function resolveAll(ids: string[]): ResolvedReference[] {
  const seen = new Set<string>();
  const out: ResolvedReference[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const r = resolveReference(id);
    if (r) out.push(r);
  }
  return out;
}
