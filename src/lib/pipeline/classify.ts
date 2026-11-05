import type { ConcernCategory } from "../types";

/**
 * Deterministic keyword classifier. It is the primary label in demo mode and a cross-check
 * against the model's label in live mode. Scores are simple weighted keyword hits.
 */
const KEYWORDS: Record<Exclude<ConcernCategory, "general_knowledge">, [RegExp, number][]> = {
  negative_returns: [
    [/\b(negative|minus|red|loss(es)?|losing|lost|down|fall(en|ing)?|fell|drop(ped|ping)?|crash(ed|ing)?|correction|declin(e|ed|ing)|below what i (put|invested))\b/i, 2],
    [/\b(returns?|portfolio|value|nav|xirr)\b/i, 1],
    [/-\s?\d+(\.\d+)?\s?%/, 3],
    [/\bvolatil(e|ity)\b/i, 2],
  ],
  small_contributions: [
    [/(₹|rs\.?|inr)\s?(100|250|500|1,?000)\b|\b(100|250|500|1,?000)\s?(rs|rupees?|₹)/i, 3],
    [/\b(small|tiny|little|insignificant|pointless|meaningless|negligible|too low|not enough|worth it|any difference|make a difference|matter)\b/i, 2],
    [/\b(amount|contribution|instalment|installment)\b/i, 1],
  ],
  conflicting_information: [
    [/\b(youtube|youtuber|influencer|reddit|twitter|instagram|telegram|whatsapp|finfluencer|friend|uncle|colleague|news|expert|tips?)\b/i, 2],
    [/\b(conflicting|contradict|confus(ed|ing)|different (advice|opinions)|someone said|people say|they say|heard|claims?|told me|rumou?rs?)\b/i, 3],
  ],
  payment_failure: [
    [/\b(fail(ed|ure|s)?|bounced?|declined|not (deducted|debited|processed)|didn'?t (go through|get debited|deduct)|unsuccessful|rejected|dishono(u)?r(ed)?)\b/i, 3],
    [/\b(mandate|autopay|auto[- ]?debit|nach|e-?mandate|upi|bank|instalment|installment|debit)\b/i, 2],
  ],
  affordability: [
    [/\b(afford|job loss|lost my job|laid off|layoff|salary (cut|delay)|emi|loan|expenses?|rent|tight|cash crunch|money problems?|bills?|medical|emergency|income (dropped|stopped)|struggling)\b/i, 3],
    [/\b(budget|savings|need the money)\b/i, 1],
  ],
  out_of_scope: [
    [/\b(crypto|bitcoin|f&o|futures|options trading|intraday|forex|lottery|betting|gold loan|insurance claim|income tax return|itr filing|real estate)\b/i, 4],
  ],
};

export interface ClassifyResult {
  category: ConcernCategory;
  scores: Partial<Record<ConcernCategory, number>>;
  alternatives: ConcernCategory[];
  confidence: "low" | "medium" | "high";
}

export function classify(text: string, hint?: ConcernCategory): ClassifyResult {
  const scores: Partial<Record<ConcernCategory, number>> = {};
  for (const [cat, rules] of Object.entries(KEYWORDS) as [ConcernCategory, [RegExp, number][]][]) {
    let s = 0;
    for (const [re, w] of rules) if (re.test(text)) s += w;
    if (s > 0) scores[cat] = s;
  }
  // A chip selection is a strong signal but free text can still outweigh it.
  if (hint) scores[hint] = (scores[hint] ?? 0) + 4;

  const ranked = (Object.entries(scores) as [ConcernCategory, number][]).sort((a, b) => b[1] - a[1]);
  if (!ranked.length || ranked[0][1] < 2) {
    return { category: "general_knowledge", scores, alternatives: ranked.map(([c]) => c).slice(0, 2), confidence: "low" };
  }
  const [top, topScore] = ranked[0];
  const close = ranked.slice(1).filter(([, s]) => s >= topScore - 1).map(([c]) => c);
  const confidence = close.length ? "low" : topScore >= 5 ? "high" : "medium";
  return { category: top, scores, alternatives: close.slice(0, 2), confidence };
}
