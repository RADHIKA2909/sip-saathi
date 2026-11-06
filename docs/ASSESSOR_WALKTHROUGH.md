# Assessor walkthrough (about 5 minutes)

No account, no personal information needed. The badge at the top right shows whether the deployment is in **Live AI** or **Demo mode**. In demo mode every answer is preapproved content and says so.

## 1. Understand the problem (30 s)

Open `/`. The welcome page states the purpose, the privacy boundaries and what the product will never do. The bottom card states that the core hypothesis is **untested** and links to the research status.

## 2. Try 3 scenarios (3 × under 90 s): `/scenarios`

Each scenario is a fictional design scenario, not a research participant.

| Scenario | Step 1: Run | Step 2: Safety demonstration | What to look for |
|---|---|---|---|
| **A. Worried about negative returns** | Explanation separates contribution from market value; cites AMFI/SEBI; "What SIP Saathi can't know" box | **Send an unsafe follow-up** ("which fund will recover fastest… guarantee it") | The input screen flags a fund pick and a prediction request; a preapproved response is shown **without calling the AI**. |
| **B. ₹500 a month feels insignificant** | Explanation cites SEBI's "as low as ₹500" passage; Journey Mirror card with demo contributions; no projections | **Show what the output validator blocks** | A developer-written unsafe draft ("Don't miss out… cost you lakhs") is run through the real validator; `no_pressure` and other rules fail, so it would be blocked. |
| **C. Unexplained failed instalment** | One failure is not a stopped SIP; cites the SEBI 3-consecutive-failures rule via AMFI; refers to bank/provider | **Try it with an account number** | The account number and PAN are removed before processing ("Personal details removed"); the answer never claims to have checked an account. |

In each result, open **What was checked** to see the five pipeline steps and every check.

## 3. Inspect grounding (30 s)

Click any numbered citation chip in an answer to open its source card, which shows the passage, the source's publisher, published and retrieved dates, content ID and a link to the original. `/sources` lists every source and passage the AI is allowed to use.

## 4. Run the evaluations (1 min): `/eval`

- **Run evaluation**: anyone can run it, with no token. It sends all 24 cases through the real pipeline, including the AI model when one is configured, and shows per-check pass/fail, timestamps and output previews. A live run takes 3 to 6 minutes.
- **Validator red-team**: 12 developer-written unsafe drafts, each blocked for the expected reason.
- The saved run shows **Human review** ratings and notes for every case, reviewed on 2026-11-07. A new run starts as pending, because its answers are different.

The committed results are in `docs/EVALUATION.md` (demo 24/24; live 23/24 with Gemini 3.5 Flash-Lite on 2026-11-04, where the one failure was a safe fallback replacing a draft that failed the grounding check). Live results vary between runs because the model does; a later production run scored 22/24, again with safe fallbacks in both failures.

## 5. Explore the rest (optional)

- `/journey`: switch between labelled demo data and your own numbers; try an invalid entry to see error recovery.
- `/market`: type a statement value to see gain/loss arithmetic; try hypothetical NAVs.
- `/advice`: press **Try examples**.
- `/canvas`: after any of the above, see it assembled with no recommendation.
- `/insights`: real event counts from this deployment, and why 12-month retention can't be measured here.
- `/about`: evidence status in three columns: actual public-source evidence, simulated scenarios, untested hypotheses.
