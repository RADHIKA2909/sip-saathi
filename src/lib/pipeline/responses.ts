import type { ConcernCategory, ExplanationPoint, FallbackReason } from "../types";

/**
 * Preapproved responses. These are written by hand from the knowledge base, cite only passages
 * that support each point, and pass the same deterministic safety rules as generated output
 * (enforced by tests). They are used in demo mode and as safe fallbacks.
 */
export interface PreapprovedResponse {
  id: string;
  intent: string;
  summary: string;
  points: ExplanationPoint[];
  uncertainty: { level: "low" | "medium" | "high"; notes: string[] };
  reflectionQuestions: string[];
}

export const CATEGORY_RESPONSES: Record<ConcernCategory, PreapprovedResponse> = {
  negative_returns: {
    id: "pre-negative-returns-v1",
    intent: "Understand how market movements affect the value and progress of a running SIP.",
    summary:
      "Your SIP's market value moves with the NAV, so it can sit above or below the total you have contributed. A lower figure describes today's value, and it is not a prediction of what happens next.",
    points: [
      {
        text: "Each instalment buys units at that day's NAV. Your market value is the number of units you hold multiplied by the current NAV, so it moves whenever the NAV moves.",
        contentIds: ["amfi-guide-units-at-nav", "amfi-guide-nav-definition"],
      },
      {
        text: "Mutual funds are market-linked. Returns are not guaranteed, and AMFI lists loss of capital, meaning getting back less than you invested, as a real risk.",
        contentIds: ["amfi-guide-risks"],
      },
      {
        text: "Equity schemes can be volatile in the short term, and SEBI describes market risk as losses caused by factors that affect the whole market.",
        contentIds: ["amfi-guide-equity-volatile", "sebi-booklet-market-risk"],
      },
      {
        text: "With a fixed instalment, a lower NAV buys more units and a higher NAV buys fewer. AMFI notes that this averaging does not guarantee profits or prevent losses.",
        contentIds: ["amfi-guide-rupee-cost-averaging"],
      },
    ],
    uncertainty: {
      level: "medium",
      notes: [
        "SIP Saathi cannot see your portfolio, the schemes you hold, or live NAVs, so it cannot say why your specific value moved.",
        "Nobody can reliably say whether or when a market value will change direction.",
      ],
    },
    reflectionQuestions: [
      "When do you expect to need this money, and is that a short, medium or long time away?",
      "Do you know the risk-o-meter level of the scheme you invested in?",
      "Is the figure you are looking at the change in value, or the total market value?",
    ],
  },
  small_contributions: {
    id: "pre-small-contributions-v1",
    intent: "Understand whether a small monthly SIP amount is meaningful.",
    summary:
      "Regulator and industry education material describes small SIP amounts as a normal way to invest. How much any amount is \"enough\" depends on your goal and time horizon, which only you can define.",
    points: [
      {
        text: "SEBI's financial education booklet notes that a SIP can be as low as ₹500 a month, and AMFI's guide mentions instalments as low as ₹250 to ₹500.",
        contentIds: ["sebi-booklet-sip", "amfi-guide-sip-definition"],
      },
      {
        text: "AMFI describes being able to start with small amounts as one of the features that makes mutual funds accessible.",
        contentIds: ["amfi-guide-small-amounts"],
      },
      {
        text: "Goal-based investing starts with defining a goal, a time horizon and your risk comfort. That makes it easier to judge progress against your own goal rather than against other people's amounts.",
        contentIds: ["amfi-guide-goal-based", "sebi-booklet-goal-horizons"],
      },
    ],
    uncertainty: {
      level: "medium",
      notes: [
        "SIP Saathi does not estimate what any amount could grow to, because that would require predicting returns.",
        "Whether an amount suits you depends on your income, expenses and goals, which are not shared here.",
      ],
    },
    reflectionQuestions: [
      "What goal is this SIP for, and roughly when would you need the money?",
      "Would it help to track how consistently instalments go through, alongside the amount?",
      "Does your monthly budget leave room for emergencies alongside this SIP?",
    ],
  },
  conflicting_information: {
    id: "pre-conflicting-information-v1",
    intent: "Make sense of conflicting advice from different people or channels.",
    summary:
      "When advice conflicts, it helps to separate claims you can check from opinions, assumptions and promises. Investor-education material from SEBI and AMFI warns specifically about tips, rumours and promises of guaranteed returns.",
    points: [
      {
        text: "AMFI warns that fraudsters often use unrealistic promises, urgency and misleading claims, and advises against relying only on testimonials or success stories.",
        contentIds: ["amfi-guide-fraud-warnings"],
      },
      {
        text: "SEBI's booklet tells investors not to fall for promises of assured returns or tips presented as investment advice, and to deal only with registered entities.",
        contentIds: ["sebi-booklet-donts", "sebi-booklet-hot-tips"],
      },
      {
        text: "SEBI also says investors should ignore rumours and unsolicited messages about investing.",
        contentIds: ["sebi-booklet-volatility-risk"],
      },
    ],
    uncertainty: {
      level: "medium",
      notes: [
        "SIP Saathi does not browse the internet and cannot verify what a particular person, video or post said.",
        "A claim that sounds confident is not necessarily wrong, and one that sounds cautious is not necessarily right. The aim is to check, not to pick a side.",
      ],
    },
    reflectionQuestions: [
      "Which parts of the advice could be checked against a regulator or fund document?",
      "Is the person giving the advice registered, and do they gain if you act on it?",
      "Does any claim promise a specific outcome or create a sense of urgency?",
    ],
  },
  payment_failure: {
    id: "pre-payment-failure-v1",
    intent: "Understand what a failed SIP instalment means and where to check its status.",
    summary:
      "A failed instalment means one scheduled debit did not go through. It is not the same as a stopped SIP. Only your bank, payment app or fund provider can tell you the exact reason and your current status.",
    points: [
      {
        text: "AMFI's investor-education site says mutual fund companies do not penalise a missed SIP instalment, but your bank may charge for a dishonoured auto-debit.",
        contentIds: ["mfsh-missed-payments"],
      },
      {
        text: "According to SEBI guidelines noted by AMFI, a monthly SIP is treated as ceased after 3 consecutive failed instalments.",
        contentIds: ["amfi-sebi-cessation-rule"],
      },
      {
        text: "Units bought with earlier instalments stay invested, and a new SIP can be started later, although it is set up as a fresh SIP.",
        contentIds: ["mfsh-missed-payments", "mfsh-restart-sip"],
      },
      {
        text: "If an issue is not resolved by the provider, SEBI's SCORES portal is the route for lodging a complaint.",
        contentIds: ["amfi-guide-grievance"],
      },
    ],
    uncertainty: {
      level: "high",
      notes: [
        "SIP Saathi has no connection to any bank, payment app or fund house, so it cannot see why your instalment failed.",
        "Common causes include insufficient balance or a mandate problem, but only your bank or provider can confirm the actual reason.",
      ],
    },
    reflectionQuestions: [
      "Did you receive a message from your bank or app that mentions a reason?",
      "Was this the first failed instalment, or have several failed in a row?",
      "Is the mandate (for example UPI AutoPay) still shown as active in your payment app?",
    ],
  },
  affordability: {
    id: "pre-affordability-v1",
    intent: "Think through a SIP when money is tight.",
    summary:
      "When income or expenses change, the first step in SEBI's financial planning guidance is to look at your overall situation: income, expenses, debts and emergency needs. SIP Saathi can explain the options that exist, but it cannot say which one fits you.",
    points: [
      {
        text: "SEBI's booklet says planning starts with understanding your income, expenses, assets and liabilities, and lists saving for emergencies as a financial goal.",
        contentIds: ["sebi-booklet-financial-situation"],
      },
      {
        text: "AMFI's investor-education site says fund houses do not penalise a missed instalment, though banks may charge for a dishonoured auto-debit.",
        contentIds: ["mfsh-missed-payments"],
      },
      {
        text: "Units you already hold can be redeemed in full or in part at the applicable NAV, but an exit load or tax may apply depending on the scheme and timing.",
        contentIds: ["amfi-guide-redemption"],
      },
      {
        text: "SEBI's booklet also advises spending within your means and not treating credit as free money.",
        contentIds: ["sebi-booklet-spend-within-means"],
      },
    ],
    uncertainty: {
      level: "high",
      notes: [
        "SIP Saathi does not know your income, expenses, debts or the terms of your scheme, so it cannot judge what is affordable for you.",
        "Rules on SIP pauses, exit loads and tax differ by scheme. Your provider's documents are the authoritative place to check them.",
      ],
    },
    reflectionQuestions: [
      "Which essential expenses need to be covered over the next few months?",
      "Do you have an emergency buffer separate from this investment?",
      "Have you checked your scheme's exit load and your provider's pause options before making changes?",
    ],
  },
  general_knowledge: {
    id: "pre-general-knowledge-v1",
    intent: "Understand how a SIP works.",
    summary: "A SIP is a way of investing a fixed amount in a mutual fund scheme at regular intervals. Here are the basics from regulator and industry education material.",
    points: [
      {
        text: "With a SIP you invest a fixed amount at regular intervals, such as monthly, often through an auto-debit from your bank account.",
        contentIds: ["amfi-guide-sip-definition", "sebi-booklet-sip"],
      },
      {
        text: "Each instalment buys units at the NAV, which is the price of one unit and is calculated at the end of each trading day.",
        contentIds: ["amfi-guide-units-at-nav", "amfi-guide-nav-definition"],
      },
      {
        text: "Mutual funds are market-linked, and their returns are not guaranteed.",
        contentIds: ["amfi-guide-risks"],
      },
    ],
    uncertainty: {
      level: "medium",
      notes: ["Your question did not clearly match one specific concern, so this is a general overview. Choosing a concern can give a more focused explanation."],
    },
    reflectionQuestions: [
      "Which part of your SIP is unclear: the amount, the value shown, or the payments?",
      "Do you know where to find your account statement or the scheme's documents?",
    ],
  },
  out_of_scope: {
    id: "pre-out-of-scope-v1",
    intent: "Ask about something outside SIP education.",
    summary:
      "SIP Saathi only explains mutual fund SIP concepts using approved regulator and industry education material. This question seems to be about something else.",
    points: [
      {
        text: "SEBI's free Saarthi app offers broader investor education, including calculators, videos and information on grievance redressal.",
        contentIds: ["amfi-guide-saarthi-app"],
      },
      {
        text: "Whatever the product, SEBI's booklet advises against acting on tips, rumours or promises of assured returns.",
        contentIds: ["sebi-booklet-donts"],
      },
    ],
    uncertainty: { level: "high", notes: ["SIP Saathi does not have approved material on this topic, so it does not attempt an answer."] },
    reflectionQuestions: ["Is there a part of your question that relates to a mutual fund SIP?", "Where could you find a registered professional or official source on this topic?"],
  },
};

export const SPECIAL_RESPONSES: Record<Extract<FallbackReason, "distress" | "prompt_injection" | "fund_recommendation" | "return_prediction">, PreapprovedResponse & { category: ConcernCategory }> = {
  distress: {
    id: "pre-distress-v1",
    category: "general_knowledge",
    intent: "Support for someone who may be in distress.",
    summary:
      "It sounds like you may be going through something very hard. Your wellbeing matters more than any investment question. Please consider talking to someone you trust, or to a trained counsellor.",
    points: [
      {
        text: "Tele MANAS, the Government of India's mental health helpline, is free and can be reached on 14416 or 1800-89-14416.",
        contentIds: ["mohfw-tele-manas"],
      },
    ],
    uncertainty: { level: "high", notes: ["SIP Saathi is an educational tool and cannot provide emotional or crisis support."] },
    reflectionQuestions: ["Is there someone you trust who you could talk to today?", "Would it help to come back to the money questions later, when you feel ready?"],
  },
  prompt_injection: {
    id: "pre-prompt-injection-v1",
    category: "general_knowledge",
    intent: "The message asked SIP Saathi to ignore or change its rules.",
    summary:
      "SIP Saathi follows fixed rules: it explains SIP concepts using approved sources and never gives fund picks, predictions or continue/stop recommendations. It cannot change these rules. You can still ask about your SIP concern in your own words.",
    points: [
      {
        text: "As a starting point, a SIP invests a fixed amount at regular intervals, and mutual fund returns are not guaranteed.",
        contentIds: ["amfi-guide-sip-definition", "amfi-guide-risks"],
      },
    ],
    uncertainty: { level: "high", notes: ["Part of your message looked like an instruction to the assistant, so it was not processed."] },
    reflectionQuestions: ["What would you like to understand about your SIP?", "Is your question about returns, the amount, payments, or conflicting advice?"],
  },
  fund_recommendation: {
    id: "pre-fund-recommendation-v1",
    category: "general_knowledge",
    intent: "Asked which fund or scheme to choose.",
    summary:
      "SIP Saathi never recommends funds or schemes. It can explain the information regulators ask investors to look at, so you can compare options yourself or with a registered professional.",
    points: [
      {
        text: "Every scheme carries a risk-o-meter with six levels from Low to Very High. SEBI says it helps match a fund's risk to an investor's risk profile.",
        contentIds: ["sebi-ppt-riskometer"],
      },
      {
        text: "AMFI's guide says new or unsure investors may be better off getting help from an intermediary, and explains how Regular and Direct plans differ in cost.",
        contentIds: ["amfi-guide-intermediary-help"],
      },
      {
        text: "SEBI advises dealing only with registered entities and not acting on tips presented as advice.",
        contentIds: ["sebi-booklet-donts"],
      },
    ],
    uncertainty: { level: "high", notes: ["Choosing a fund depends on your goals, horizon and risk profile, none of which SIP Saathi assesses."] },
    reflectionQuestions: ["What risk-o-meter level are you comfortable with for this goal?", "Would a SEBI-registered professional help you compare options?"],
  },
  return_prediction: {
    id: "pre-return-prediction-v1",
    category: "negative_returns",
    intent: "Asked for a forecast, a recovery date or a promise of a fixed return.",
    summary:
      "Nobody can reliably predict market movements or promise a return, and SIP Saathi does not try. Here is what regulator and industry material says about uncertainty.",
    points: [
      {
        text: "AMFI states that mutual fund returns are not guaranteed and that investors can get back less than they invested.",
        contentIds: ["amfi-guide-risks"],
      },
      {
        text: "AMFI's guide warns that fraudsters use unrealistic promises, and advises against trusting promises of guaranteed high returns.",
        contentIds: ["amfi-guide-fraud-warnings"],
      },
      {
        text: "AMFI's rupee cost averaging explainer says it is impossible to time the market.",
        contentIds: ["mfsh-rca-mechanism"],
      },
    ],
    uncertainty: { level: "high", notes: ["Any forecast you see elsewhere is an opinion or a model, not a known fact."] },
    reflectionQuestions: ["What would you do differently if nobody could tell you what happens next?", "How long is it until you need this money?"],
  },
};

export const NEXT_STEPS: Record<ConcernCategory, { label: string; href: string }[]> = {
  negative_returns: [
    { label: "Learn market value vs contribution", href: "/market" },
    { label: "See your contributions in the Journey Mirror", href: "/journey" },
    { label: "Build your Decision Clarity Canvas", href: "/canvas" },
  ],
  small_contributions: [
    { label: "Track consistency in the Journey Mirror", href: "/journey" },
    { label: "Learn about time horizons", href: "/market#time-horizon" },
    { label: "Build your Decision Clarity Canvas", href: "/canvas" },
  ],
  conflicting_information: [
    { label: "Decode specific statements", href: "/advice" },
    { label: "Build your Decision Clarity Canvas", href: "/canvas" },
  ],
  payment_failure: [
    { label: "Open Payment Help", href: "/payment" },
    { label: "Build your Decision Clarity Canvas", href: "/canvas" },
  ],
  affordability: [
    { label: "See what failed, paused and stopped mean", href: "/payment" },
    { label: "Build your Decision Clarity Canvas", href: "/canvas" },
  ],
  general_knowledge: [
    { label: "Learn the key terms", href: "/market" },
    { label: "Explore the Journey Mirror", href: "/journey" },
  ],
  out_of_scope: [{ label: "Choose a SIP concern", href: "/concern" }],
};
