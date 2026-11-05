import type { InputFlag } from "../types";

/**
 * Deterministic screen applied to user text before anything else happens.
 * Masks personal identifiers so they are never sent to a model or stored, and raises flags that
 * route the request (distress, prompt injection, fund picks, predictions) to preapproved responses.
 */

export interface ScreenResult {
  masked: string;
  maskedCount: number;
  flags: InputFlag[];
  /** Highest-priority routing decision, if the request must not reach generation. */
  route: "distress" | "prompt_injection" | "fund_recommendation" | "return_prediction" | null;
}

const PII_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi, label: "[PAN removed]" },
  { re: /\b[\w.+-]+@[\w-]+(\.[\w-]+)+\b/g, label: "[email removed]" },
  { re: /\b[\w.-]{2,}@(ok\w+|ybl|ibl|axl|paytm|upi|apl|icici|sbi|hdfcbank|axisbank|kotak|yesbank|valid)\b/gi, label: "[UPI ID removed]" },
  { re: /(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g, label: "[phone removed]" },
  { re: /\b\d{4}[\s-]\d{4}[\s-]\d{4}(?:[\s-]\d{4})?\b/g, label: "[number removed]" },
  { re: /\b\d{9,18}\b/g, label: "[number removed]" },
  { re: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g, label: "[IFSC removed]" },
];

export function maskPII(text: string): { masked: string; count: number } {
  let count = 0;
  let out = text;
  for (const { re, label } of PII_PATTERNS) {
    out = out.replace(re, () => {
      count++;
      return label;
    });
  }
  return { masked: out, count };
}

const DISTRESS_RE =
  /\b(suicid\w*|kill (myself|me)|end (my|it all|my life)|want to die|don'?t want to (live|be alive)|self[- ]?harm|hurt myself|no reason to live|can'?t go on|better off dead)\b/i;
const EMOTIONAL_RE = /\b(panic(king|ked)?|scared|terrified|anxious|anxiety|stressed|stress|losing sleep|can'?t sleep|worried sick|devastated|crying|ruined|hopeless|depressed)\b/i;

const INJECTION_RE =
  /\b(ignore|disregard|forget|override|bypass)\b[^.]{0,40}\b(previous|prior|above|earlier|all|your|the|system)\b[^.]{0,30}\b(instructions?|rules?|prompts?|guidelines?|polic(y|ies)|messages?)\b|\b(system prompt|developer mode|jailbreak|DAN mode|you are now|act as (an?|my) (financial )?(advisor|adviser|broker|expert)|pretend (to be|you are)|reveal (your|the) (prompt|instructions|rules)|new instructions?:|<\/?system>|\[system\])/i;

const FUND_PICK_RE =
  /\b(which|best|top|good|better|safest|highest[- ]returning|recommended|suggested)\s+([\w-]+\s+){0,3}(funds?|schemes?|amcs?|stocks?)\b|\bshould i (buy|invest in|switch to|move to|pick|choose)\b|\b(recommend|suggest|name|tell)\s+(me\s+)?(a|some|any|the best|one|which)\s+([\w-]+\s+){0,2}(funds?|schemes?|stocks?|sips?)\b|\bwhere should i (invest|put)\b/i;

const PREDICTION_RE =
  /\b(will|when will|how (soon|long) (will|until|till|before)|predict|forecast|is it going to|are markets? going to|guarantee|promise|be sure)\b[^.?!]{0,50}\b(markets?|nifty|sensex|nav|returns?|recover(y)?|bounce back|go up|rise|rebound|profit|grow|double|crash|fall)\b|\b(how much|what) (returns?|profit|money) (will|would|can|could) (i|my sip) (get|make|earn|have)\b|\bexpected return\b/i;

const DECISION_RE = /\b(should i|do i need to|is it (wise|smart|better|okay|ok) to|would you)\b[^.?!]{0,40}\b(stop|pause|continue|cancel|keep|redeem|withdraw|sell|exit|increase|reduce)\b/i;
const SOURCE_RE = /\b(source|link|citation|cite|circular|article|study|report|proof|evidence|news)\b[^.?!]{0,60}\b(says?|said|claims?|shows?|prove|that)\b|\b(according to|as per)\b/i;

export function screenInput(text: string): ScreenResult {
  const { masked, count } = maskPII(text);
  const flags: InputFlag[] = [];
  const t = masked;

  if (count > 0) flags.push({ id: "sensitive_data", label: "Personal identifiers were removed before processing" });
  const distress = DISTRESS_RE.test(t);
  if (distress) flags.push({ id: "distress", label: "Message suggests serious distress" });
  else if (EMOTIONAL_RE.test(t)) flags.push({ id: "emotional_load", label: "Message expresses worry or stress" });
  const injection = INJECTION_RE.test(t);
  if (injection) flags.push({ id: "prompt_injection", label: "Message tries to change the assistant's rules" });
  const fundPick = FUND_PICK_RE.test(t);
  if (fundPick) flags.push({ id: "fund_recommendation", label: "Asks for a fund or scheme pick" });
  const prediction = PREDICTION_RE.test(t);
  if (prediction) flags.push({ id: "return_prediction", label: "Asks for a forecast or guarantee" });
  if (DECISION_RE.test(t)) flags.push({ id: "decision_request", label: "Asks whether to continue, pause or stop" });
  if (SOURCE_RE.test(t)) flags.push({ id: "source_request", label: "Refers to an outside source SIP Saathi cannot verify" });

  const route = distress ? "distress" : injection ? "prompt_injection" : fundPick ? "fund_recommendation" : prediction ? "return_prediction" : null;
  return { masked, maskedCount: count, flags, route };
}
