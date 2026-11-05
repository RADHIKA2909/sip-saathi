/**
 * Approved educational passages. Each passage is a close paraphrase of its source (short quotations
 * are marked with quotation marks and copied exactly). The `locator` says where in the source the
 * passage comes from so a reviewer can check it.
 *
 * Passages deliberately avoid the illustrative return projections some sources contain
 * (e.g. "an average return of 10%"), because SIP Saathi never shows return figures.
 */
export type Topic =
  | "sip_basics"
  | "nav"
  | "market_value"
  | "risk"
  | "volatility"
  | "rupee_cost_averaging"
  | "time_horizon"
  | "small_amounts"
  | "affordability"
  | "financial_planning"
  | "misinformation"
  | "grievance"
  | "redemption"
  | "missed_instalment"
  | "cancellation"
  | "mandate"
  | "fund_choice"
  | "wellbeing";

export interface Passage {
  contentId: string;
  sourceId: string;
  locator: string;
  topics: Topic[];
  text: string;
}

export const PASSAGES: readonly Passage[] = [
  // --- AMFI pocket guide -----------------------------------------------------------------------
  {
    contentId: "amfi-guide-sip-definition",
    sourceId: "amfi-pocket-guide",
    locator: "p. 18, Modes of Investing in Mutual Funds: SIP",
    topics: ["sip_basics", "small_amounts", "mandate"],
    text: "A Systematic Investment Plan (SIP) lets you invest a fixed amount in a mutual fund scheme at regular intervals, for example daily, weekly or monthly. The guide says the instalment \"can be as low as 250-500 per month\" and that you can set up auto-debit from your bank account for the instalments.",
  },
  {
    contentId: "amfi-guide-units-at-nav",
    sourceId: "amfi-pocket-guide",
    locator: "p. 01, What happens when you invest money in a Mutual Fund?",
    topics: ["nav", "market_value", "sip_basics"],
    text: "When you invest in a mutual fund, the fund issues units to you against the amount invested, at the prevailing NAV (Net Asset Value), which is the price you pay per unit.",
  },
  {
    contentId: "amfi-guide-nav-definition",
    sourceId: "amfi-pocket-guide",
    locator: "p. 17, Common Terms: What is NAV?",
    topics: ["nav", "market_value"],
    text: "NAV is the price of one unit of a mutual fund. It is calculated at the end of each trading day by subtracting total liabilities from total assets and dividing by the number of outstanding units.",
  },
  {
    contentId: "amfi-guide-risks",
    sourceId: "amfi-pocket-guide",
    locator: "p. 16, Risks in Mutual Funds",
    topics: ["risk", "volatility", "market_value"],
    text: "Mutual funds are market-linked investments. \"Returns are not guaranteed\", and the value of investments can fluctuate with market movements, interest-rate changes, credit events or economic factors. The guide lists market risk (the fund's value moves up and down with stock and bond markets) and loss of capital (the possible risk of getting back less than what you invested).",
  },
  {
    contentId: "amfi-guide-rupee-cost-averaging",
    sourceId: "amfi-pocket-guide",
    locator: "p. 20, Rupee Cost Averaging",
    topics: ["rupee_cost_averaging", "volatility", "sip_basics"],
    text: "With a SIP you invest the same amount regularly regardless of how the market moves, so you buy more units when prices are low and fewer when prices are high. In the guide's illustrative example, ₹1,000 buys 50 units at a NAV of 20 and 100 units at a NAV of 10, an average cost of about 13.33 per unit for 150 units. The guide states that this \"doesn't guarantee profits or prevent losses\".",
  },
  {
    contentId: "amfi-guide-equity-volatile",
    sourceId: "amfi-pocket-guide",
    locator: "p. 05, Types of Mutual Fund Schemes: Equity Schemes",
    topics: ["volatility", "risk", "time_horizon"],
    text: "An equity scheme primarily invests in equities and equity-related instruments. The guide notes that such schemes may be volatile in the short term.",
  },
  {
    contentId: "amfi-guide-small-amounts",
    sourceId: "amfi-pocket-guide",
    locator: "p. 02, Key benefits: Affordability & convenience",
    topics: ["small_amounts", "affordability"],
    text: "The guide describes mutual funds as accessible because you can start investing with small amounts.",
  },
  {
    contentId: "amfi-guide-goal-based",
    sourceId: "amfi-pocket-guide",
    locator: "p. 21, Goal-based Investing",
    topics: ["time_horizon", "financial_planning", "small_amounts"],
    text: "Goal-based investing means first defining your goal, your time horizon and your risk comfort, and then choosing investments that align with that goal. The guide says this helps you stay focused and track progress more clearly.",
  },
  {
    contentId: "amfi-guide-fraud-warnings",
    sourceId: "amfi-pocket-guide",
    locator: "p. 26, Protect Yourself with SEBI Check Tool",
    topics: ["misinformation"],
    text: "The guide warns that fraudsters often use unrealistic promises, urgency and misleading claims. Its don'ts include: don't trust promises of guaranteed high returns, don't rush into investments due to pressure or urgency, and don't rely solely on testimonials or success stories. Its do's include verifying credentials and asking questions when in doubt.",
  },
  {
    contentId: "amfi-guide-grievance",
    sourceId: "amfi-pocket-guide",
    locator: "p. 24, SCORES (SEBI Complaint Redressal System)",
    topics: ["grievance", "missed_instalment"],
    text: "If you have a complaint, first raise it with the concerned entity through its designated grievance officials. If it remains unresolved, you can lodge it on SEBI's SCORES portal (scores.sebi.gov.in) or mobile app and track its status online.",
  },
  {
    contentId: "amfi-guide-redemption",
    sourceId: "amfi-pocket-guide",
    locator: "p. 23, What is Redemption?",
    topics: ["redemption", "market_value"],
    text: "Redemption means selling your mutual fund units. Units are sold at the applicable NAV and the proceeds are credited to your bank account. Depending on the scheme, an exit load or tax may apply, especially if you redeem before a specified period. You can redeem all at once or in parts.",
  },
  {
    contentId: "amfi-guide-intermediary-help",
    sourceId: "amfi-pocket-guide",
    locator: "p. 14, Plans & Options: Regular Plan",
    topics: ["fund_choice"],
    text: "The guide says that if you are a new or inexperienced investor, or unsure which scheme to invest in, you may be better off seeking the help of an intermediary. Investing through an intermediary means a Regular Plan, which involves distribution expenses; Direct Plans do not involve distributor commission.",
  },
  {
    contentId: "amfi-guide-saarthi-app",
    sourceId: "amfi-pocket-guide",
    locator: "p. 25, SEBI Saarthi App",
    topics: ["fund_choice", "misinformation", "sip_basics"],
    text: "The SEBI Saarthi App is a free personal finance and investment education app developed by SEBI, with calculators, educational videos and information on mutual funds and grievance redressal.",
  },
  // --- SEBI Financial Education Booklet --------------------------------------------------------
  {
    contentId: "sebi-booklet-sip",
    sourceId: "sebi-financial-education-booklet",
    locator: "pp. 31–32, What is Systematic Investment Plan (SIP)?",
    topics: ["sip_basics", "small_amounts", "rupee_cost_averaging", "mandate"],
    text: "A SIP lets an investor put a fixed amount regularly (weekly, monthly or quarterly) into a mutual fund scheme. SEBI's booklet says that instead of trying to time the market, investing regularly brings a rupee-cost-averaging effect, and that an investor can invest an amount \"as low as ₹500/-\" every month or quarter. Instalments after the first may be auto-debited through a standing instruction or electronic clearing.",
  },
  {
    contentId: "sebi-booklet-volatility-risk",
    sourceId: "sebi-financial-education-booklet",
    locator: "p. 24, Types of Risks: Volatility Risk; How to mitigate the risk?",
    topics: ["volatility", "risk", "misinformation"],
    text: "SEBI's booklet describes volatility risk as the risk that share prices fluctuate even when the companies are not in danger of failing. It mentions investing through a SIP, or buying in smaller lots over time, as ways to manage volatility risk, and says investors should ignore rumours and unsolicited messages about investing.",
  },
  {
    contentId: "sebi-booklet-market-risk",
    sourceId: "sebi-financial-education-booklet",
    locator: "p. 23, Types of Risks: Market risk or Systematic Risk",
    topics: ["risk", "volatility", "market_value"],
    text: "Market (systematic) risk means an investor may experience losses because of factors affecting the overall performance of financial markets and the economy. Stock market bubbles and crashes are examples of heightened market risk.",
  },
  {
    contentId: "sebi-booklet-goal-horizons",
    sourceId: "sebi-financial-education-booklet",
    locator: "pp. 11–12, Five-Step Approach: Classify goals",
    topics: ["time_horizon", "financial_planning"],
    text: "SEBI's booklet classifies goals by time horizon: short-term goals arise within a few months to one year, medium-term goals within one to eight years, and long-term goals over eight years or more. It says investing should be planned according to age, risk appetite, financial situation and investment horizon.",
  },
  {
    contentId: "sebi-booklet-diversification",
    sourceId: "sebi-financial-education-booklet",
    locator: "p. 13, Diversification",
    topics: ["risk"],
    text: "Diversification spreads investments across different instruments and asset classes that may react differently to the same event. SEBI's booklet notes that diversification \"does not provide guarantee against loss\".",
  },
  {
    contentId: "sebi-booklet-financial-situation",
    sourceId: "sebi-financial-education-booklet",
    locator: "pp. 10–11, Financial Planning Process",
    topics: ["affordability", "financial_planning"],
    text: "SEBI's booklet says planning starts with understanding your current financial situation: your income, expenses, assets and liabilities. It lists saving for emergencies alongside investing for future financial security as financial goals.",
  },
  {
    contentId: "sebi-booklet-spend-within-means",
    sourceId: "sebi-financial-education-booklet",
    locator: "p. 47, Tips to Avoid 'Debt Trap'",
    topics: ["affordability", "financial_planning"],
    text: "Among its tips to avoid a debt trap, SEBI's booklet advises spending within your means, not buying more than you can afford, and not treating credit cards as free money.",
  },
  {
    contentId: "sebi-booklet-donts",
    sourceId: "sebi-financial-education-booklet",
    locator: "p. 59, Investment Advisers: Do's and Don'ts",
    topics: ["misinformation", "fund_choice"],
    text: "SEBI's booklet tells investors not to fall for the promise of assured returns, not to fall for stock tips offered as investment advice, and not to get carried away by luring advertisements or market rumours. It also asks investors to deal only with registered entities.",
  },
  {
    contentId: "sebi-booklet-hot-tips",
    sourceId: "sebi-financial-education-booklet",
    locator: "p. 37, Investor precautions",
    topics: ["misinformation"],
    text: "SEBI's booklet advises against making investment decisions based on hot tips, noting that a person spreading them may be trying to offload securities, and that disseminating hot tips is an illegal activity that should be reported to SEBI.",
  },
  // --- SEBI Introduction to Mutual Funds presentation -----------------------------------------
  {
    contentId: "sebi-ppt-investment-modes",
    sourceId: "sebi-intro-mutual-funds",
    locator: "Slide 16, Investment Modes in Mutual Funds",
    topics: ["sip_basics", "volatility"],
    text: "SEBI's presentation contrasts a lump-sum investment (usually a large sum in one go, where the investor faces the risk of market volatility) with a SIP: staggered investment at specific intervals such as monthly or quarterly, made on specific dates of the month.",
  },
  {
    contentId: "sebi-ppt-riskometer",
    sourceId: "sebi-intro-mutual-funds",
    locator: "Slide 20, Risk-o-Meter and its importance",
    topics: ["risk", "fund_choice", "volatility"],
    text: "Mutual fund schemes carry a risk-o-meter with six levels, from Low to Very High. SEBI's presentation says it helps align the risk a fund carries with the risk profile of the investor, and describes equity as an asset class as volatile and high risk.",
  },
  {
    contentId: "sebi-ppt-helplines",
    sourceId: "sebi-intro-mutual-funds",
    locator: "Slide 24, For Additional Information",
    topics: ["grievance"],
    text: "SEBI lists SCORES (scores.gov.in) for redressal of grievances and toll-free helplines 1800 266 7575 and 1800 22 7575, available in several languages.",
  },
  // --- Mutual Funds Sahi Hai (AMFI) ------------------------------------------------------------
  {
    contentId: "mfsh-rca-mechanism",
    sourceId: "mfsh-rupee-cost-averaging",
    locator: "What is Rupee Cost Averaging? (main text)",
    topics: ["rupee_cost_averaging", "volatility"],
    text: "AMFI's explainer says that with a fixed SIP amount you end up buying more units when markets fall and fewer when they rise, so the average unit cost of the units you hold \"tends to fall over time\". It also states that \"it is impossible to time the market.\"",
  },
  {
    contentId: "mfsh-missed-payments",
    sourceId: "mfsh-missed-sip-payments",
    locator: "What happens when you miss SIP payments in-between? (main text)",
    topics: ["missed_instalment", "cancellation", "redemption"],
    text: "AMFI's explainer says mutual fund companies don't penalise you for a missed SIP instalment, but adds that \"your bank will penalize you for dishonoring the auto debit payments\" (charges are set by your bank). It says a SIP is automatically cancelled if payments fail for three consecutive months, that investments made so far stay invested and can be withdrawn, and that you can start a fresh SIP later.",
  },
  {
    contentId: "mfsh-restart-sip",
    sourceId: "mfsh-start-stop-sip",
    locator: "How do I start/stop a SIP? (main text)",
    topics: ["missed_instalment", "cancellation"],
    text: "AMFI's explainer says there is no penalty from the fund if you miss an instalment or two; at most the fund house would stop the SIP, after which further instalments would not be debited. You can start another SIP, even in the same folio, but it is treated as a fresh SIP and may take some time to set up.",
  },
  {
    contentId: "amfi-sebi-cessation-rule",
    sourceId: "amfi-sip-data-page",
    locator: "SIP data notes",
    topics: ["cancellation", "missed_instalment"],
    text: "AMFI's SIP data page notes that, as per SEBI guidelines, SIPs where 3 consecutive instalments fail (for daily, weekly, fortnightly and monthly SIPs) or 2 consecutive instalments fail (for other frequencies) are treated as ceased or discontinued.",
  },
  // --- NPCI ------------------------------------------------------------------------------------
  {
    contentId: "npci-autopay-mandate",
    sourceId: "npci-upi-autopay-guideline",
    locator: "UPI AutoPay Feature; Mandate Acceptance screens",
    topics: ["mandate", "missed_instalment"],
    text: "UPI AutoPay lets a user create a mandate for recurring payments, authorised with the UPI PIN. Under the mandate, the amount is debited multiple times at the stated frequency during the mandate's validity. NPCI's guideline states: \"You can also pause or revoke the mandate anytime.\"",
  },
  // --- MoHFW -----------------------------------------------------------------------------------
  {
    contentId: "mohfw-tele-manas",
    sourceId: "mohfw-tele-manas",
    locator: "National Mental Health Programme page",
    topics: ["wellbeing"],
    text: "The Government of India's Tele MANAS mental health helpline can be reached on the toll-free number 1800-89-14416 or the short code 14416.",
  },
];

export const PASSAGE_BY_ID: ReadonlyMap<string, Passage> = new Map(PASSAGES.map((p) => [p.contentId, p]));
