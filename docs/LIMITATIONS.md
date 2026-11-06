# Research status, evidence separation and limitations

## Evidence status

| Category | What it contains | Status |
|---|---|---|
| **Actual public-source evidence** | AI-assisted discovery screened 377 public records and selected 18 qualitative conversations. Overlapping themes: knowledge gaps 7, market anxiety 6, motivation/progress 4, fund-choice anxiety 4, continuation enablers 3, payment friction 2, financial pressure 1. The knowledge base: 9 public regulator, industry and government sources, fetched and read on 2026-11-04. | Real, but qualitative and small. Theme counts are **not** prevalence estimates and imply nothing causal. |
| **Discovery classifier evaluation** | 20 human-approved examples: theme micro-F1 68%, SIP status accuracy 90%, first-time label accuracy 90%, 19/20 verbatim quotes, 1 flagged potentially invented detail. | Small sample; not full validation. **Separate** from the MVP evaluation. |
| **Simulated scenarios** | Six AI-generated personas used as fictional design/test scenarios; the three assessor scenarios; the Journey Mirror demo data; the 24 MVP test cases (developer-written). | Fictional. Not interviews and not usability testing. |
| **Untested hypotheses** | That first-time investors facing volatility, conflicting information or unclear progress may struggle to make informed continuation decisions; that grounded, neutral explanations may improve understanding and clarity; any link to 12-month active-SIP retention. | Not tested with real users. |

## What has been verified

- Each knowledge-base source URL was fetched; PDFs were downloaded and their text extracted; each passage was written against that text. Passages are paraphrases; quoted fragments are copied exactly.
- The MVP evaluation suite was executed in demo mode (24/24) and live mode with `gemini-3.5-flash-lite` (23/24); see `docs/EVALUATION.md`.
- Unit, integration and end-to-end tests pass, including axe accessibility scans (no serious or critical violations) on every page at desktop and mobile sizes.

## Human review

The project owner reviewed clarity and factual quality for all 24 cases of the saved live run on 2026-11-07 (mean clarity 3.96/5, mean factual quality 4.71/5; per-case ratings and notes are in `docs/EVALUATION.md`). This is one non-independent reviewer, and the ratings apply only to that run's outputs. New runs start as pending because the model's answers vary.

The project owner also re-checked the knowledge-base passages against their sources on 2026-11-07.

## What still requires human verification

- **Screen-reader experience:** automated axe checks and keyboard tests pass, but the app has not been tested with NVDA, VoiceOver or TalkBack users.
- **Live AI behaviour beyond the 24 cases:** model output varies; the validator and judge reduce risk but cannot guarantee correctness.

## Known limitations

- Safety rules are pattern-based and English-only. They can miss novel unsafe phrasing and can over-block safe phrasing (over-blocking only produces a safe fallback, as in MVP-24 live).
- The "claims supported" check is lexical overlap (≥30% of content words), an automated estimate rather than proof of accuracy.
- The AI judge is itself a model and is fallible; it can only block.
- The rule-based classifier is simple; ambiguous questions may get a general overview.
- The knowledge base is small (31 passages). Some Mutual Funds Sahi Hai pages show no publication date; rules may change after the retrieval date.
- General payment troubleshooting steps are written for this prototype and are not sourced from a specific document (labelled as such in the UI).
- No accounts, portfolios, mandates or live market data. Nothing in the app reflects anyone's real status.
- Analytics are counts only; they cannot show individual journeys or outcomes, and 12-month retention is out of scope.
- On Vercel without Redis, storage is in-memory and resets on cold starts. Evaluation history can also miss runs that were split across server instances.
- Public evaluation runs share the AI quota with the app. If the quota runs out, cases fail with a `quota` fallback and live answers fall back to preapproved content until it resets.
