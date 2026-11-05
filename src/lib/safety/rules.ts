import type { CheckResult } from "../types";

/**
 * Deterministic output safety rules. Every piece of text shown to a user, whether generated or
 * preapproved, is checked against these. They are intentionally conservative: a false positive
 * only means a safe preapproved response is shown instead.
 */
export const POLICY_VERSION = "policy-v1";

export interface SafetyRule {
  id: string;
  label: string;
  description: string;
  /** Returns the offending snippet, or null if the text passes. */
  test: (text: string) => string | null;
}

/** Fund houses / AMC brands. Naming any of these in an answer could read as a recommendation. */
export const AMC_BRANDS = [
  "SBI", "HDFC", "ICICI", "ICICI Prudential", "Axis", "Nippon", "Kotak", "Mirae", "Parag Parikh", "PPFAS", "Quant",
  "Motilal Oswal", "UTI", "Aditya Birla", "DSP", "Tata", "Franklin", "Franklin Templeton", "Edelweiss", "Canara Robeco",
  "Groww", "Navi", "Bandhan", "Invesco", "HSBC", "PGIM", "Sundaram", "Baroda BNP", "Mahindra Manulife", "LIC MF",
  "Union", "JM Financial", "Quantum", "WhiteOak", "Bajaj Finserv", "Helios", "Zerodha", "ITI", "Samco", "360 ONE", "Old Bridge",
  "Shriram", "Trust MF", "NJ",
] as const;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const AMC_RE = new RegExp(`\\b(${AMC_BRANDS.map(escape).join("|")})\\b(?=[^.]{0,40}\\b(fund|mutual|amc|scheme|bluechip|flexi|cap|index|elss|nifty)\\b)`, "i");
const NAMED_FUND_RE = /\b[A-Z][A-Za-z&]+(\s[A-Z][A-Za-z&]+){0,3}\s(Bluechip|Flexi ?Cap|Small ?Cap|Mid ?Cap|Large ?Cap|Multi ?Cap|Focused|Value|Index|ELSS|Tax ?Saver|Balanced Advantage)\s(Fund|Plan)\b/;

const NEGATORS = /\b(not|no|never|nor|without|cannot|can't|doesn't|does not|don't|do not|isn't|is not|aren't|are not|won't|neither)\b/i;

/** True when the match is preceded (within the same clause, ~6 words) by a negation. */
function negated(text: string, index: number): boolean {
  const before = text.slice(Math.max(0, index - 60), index);
  const clause = before.split(/[.;:!?]|,\s(?:but|and|so)\b/).pop() ?? "";
  const words = clause.trim().split(/\s+/).slice(-6).join(" ");
  return NEGATORS.test(words) || WARNING_CONTEXT.test(words);
}

/** Phrases that introduce a warning about a guarantee rather than making one. */
const WARNING_CONTEXT =
  /\b(promises? of|claims? of|offers? of|against|fall for|beware( of)?|warns?( about)?|suspicious of|wary of|claims?( an?| that| to be)?|claiming( an?)?|asserts?( an?)?|implies( an?)?|implying( an?)?)\s*(\w+\s+)?$/i;

function firstUnnegated(text: string, re: RegExp): string | null {
  const g = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
  for (const m of text.matchAll(g)) {
    if (!negated(text, m.index ?? 0)) return m[0];
  }
  return null;
}

function first(text: string, ...res: RegExp[]): string | null {
  for (const re of res) {
    const m = re.exec(text);
    if (m) return m[0];
  }
  return null;
}

export const SAFETY_RULES: readonly SafetyRule[] = [
  {
    id: "no_fund_names",
    label: "No fund or fund-house names",
    description: "Naming a specific scheme or AMC could be read as a recommendation.",
    test: (t) => first(t, AMC_RE, NAMED_FUND_RE),
  },
  {
    id: "no_guarantees",
    label: "No guaranteed outcomes",
    description: "Blocks promises such as guaranteed, assured, risk-free or sure-shot returns (negated statements like 'returns are not guaranteed' are allowed).",
    test: (t) => firstUnnegated(t, /\b(guarantee[sd]?|assured (returns?|profits?|gains?)|risk[- ]free|sure[- ]shot|can(not|'t) lose|zero risk|100% safe)\b/i),
  },
  {
    id: "no_predictions",
    label: "No market forecasts or recovery promises",
    description: "Blocks statements that markets, NAVs or a portfolio will rise, recover or bounce back.",
    test: (t) =>
      firstUnnegated(
        t,
        /\b((markets?|nifty|sensex|nav|prices?|(your )?(portfolio|investments?|money|fund|sip)s?|it|they|losses?|this)\s(will|would|is going to|are going to|is bound to|are bound to|is likely to|are likely to|is expected to|are expected to|should)\s(definitely\s|surely\s|eventually\s|soon\s)?(recover|rebound|bounce back|rise|go up|grow|increase|come back|turn positive|improve|double|be back))\b/i,
      ) ??
      first(t, /\b(recover(y)?|bounce back|rebound)\s(soon|eventually|in time|for sure)\b/i, /\b(will|going to) (definitely|surely) (recover|grow|rise)\b/i),
  },
  {
    id: "no_return_figures",
    label: "No return percentages or projections",
    description: "Blocks return rates, CAGR figures and projected corpus amounts.",
    test: (t) =>
      first(
        t,
        /\b\d+(\.\d+)?\s?%\s*(annual(ised|ized)?\s)?(returns?|p\.?\s?a\.?|cagr|per (year|annum)|a year|yearly|xirr)\b/i,
        /\b(returns?|cagr|xirr|grow(th)?|earn)\b[^.]{0,30}\b\d+(\.\d+)?\s?%/i,
        /\b(will|could|can|would) (grow|become|turn) (in)?to\s?(₹|rs\.?|inr)\s?\d/i,
        /\bcorpus of\s?(₹|rs\.?|inr)?\s?\d/i,
      ),
  },
  {
    id: "no_directives",
    label: "No continue / pause / stop recommendations",
    description: "Blocks telling the person what to do with their SIP or money.",
    test: (t) =>
      first(
        t,
        /\b(you|investors?|one|people)\s(should|must|need to|have to|ought to|had better)\s(not\s)?(definitely\s)?(continue|keep|stop|pause|cancel|redeem|withdraw|sell|switch|stay|invest|increase|decrease|hold|exit|buy|start|restart|skip)\b/i,
        /(^|[.!?]\s+|\n)\s*(continue|keep|stop|pause|cancel|redeem|sell|switch|exit|hold on|stay invested|don't stop|do not stop|never stop|don't pause|do not pause|don't panic)\b/i,
        /\b(i|we)\s(would\s)?(strongly\s)?(recommend|suggest|advise|urge)\b/i,
        /\b(best|right|ideal|perfect) (fund|scheme|option|choice|time) (for you|to (buy|invest|sell|stop|start))\b/i,
        /\bmy (advice|recommendation)\b/i,
        /\bit('s| is) (better|best|wise|smart) (for you )?to (continue|keep|stop|pause|redeem|sell|stay)\b/i,
      ),
  },
  {
    id: "no_pressure",
    label: "No fear, urgency or FOMO nudges",
    description: "Blocks retention pressure such as 'don't miss out', 'you'll regret', 'act now' or 'cost you lakhs'.",
    test: (t) =>
      first(
        t,
        /\b(don't|do not) miss out\b/i,
        /\bmiss(ed|ing)? (out on )?(the )?(opportunit(y|ies)|recovery|rally|gains)\b/i,
        /\b(act|decide|invest) (now|today|immediately)\b/i,
        /\bbefore it'?s too late\b/i,
        /\bhurry\b/i,
        /\blimited time\b/i,
        /\byou('ll| will) regret\b/i,
        /\bnow is the (best|right|perfect) time\b/i,
        /\b(cost|costs|costing) you (dearly|lakhs|crores|a fortune)\b/i,
        /\blos(e|ing) out\b/i,
        /\beveryone (else )?is (investing|buying|staying)\b/i,
      ),
  },
  {
    id: "no_live_data_claims",
    label: "No claims of live account or market data",
    description: "SIP Saathi has no integrations, so it must never imply it checked an account, mandate or live market.",
    test: (t) =>
      first(
        t,
        /\b(i|we)('ve| have)? (checked|verified|looked up|can see|fetched|confirmed) (your|the) (account|mandate|portfolio|sip|status|bank|payment|transaction)/i,
        /\byour (account|mandate|portfolio|sip) (shows|currently shows|is currently|has been)\b/i,
        /\b(today'?s|current|live|latest) (nav|market (level|price)|nifty|sensex) (is|was|stands)\b/i,
      ),
  },
  {
    id: "no_personal_identifiers",
    label: "No personal identifiers in output",
    description: "Output must never contain PAN-like codes, long account-like numbers, phone numbers or emails.",
    test: (t) => first(t, /\b[A-Z]{5}[0-9]{4}[A-Z]\b/, /\b\d{9,18}\b/, /\b(\+91[\s-]?)?[6-9]\d{9}\b/, /\b[\w.+-]+@[\w-]+\.[\w.]+\b/),
  },
];

/** Text exempt from no_personal_identifiers: official helpline numbers from the knowledge base. */
const ALLOWED_NUMBERS = ["1800-89-14416", "1800 266 7575", "1800 22 7575", "14416"];

function stripAllowed(t: string): string {
  return ALLOWED_NUMBERS.reduce((acc, n) => acc.split(n).join(" "), t);
}

export function runSafetyRules(texts: string[]): CheckResult[] {
  const joined = texts.filter(Boolean).join("\n");
  const cleaned = stripAllowed(joined);
  return SAFETY_RULES.map((rule) => {
    const hit = rule.test(rule.id === "no_personal_identifiers" ? cleaned : joined);
    return { id: rule.id, label: rule.label, passed: hit === null, ...(hit ? { detail: `Matched: “${hit.trim().slice(0, 80)}”` } : {}) };
  });
}
