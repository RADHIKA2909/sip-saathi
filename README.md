# SIP Saathi: Your SIP journey, made clearer

An AI-native educational prototype that helps first-time mutual fund SIP investors understand negative returns, small contributions, conflicting advice and failed payments, without giving investment advice.

> **Independent NextLeap product management graduation project.** Not affiliated with, endorsed by or connected to Groww or any other investment platform, fund house, bank or regulator. No fund recommendations, return predictions, continue/pause/stop recommendations, or fear/FOMO/urgency nudges.

**Business goal it explores:** increase the share of first-time investors with an active SIP 12 months after starting (at least one successful instalment in the preceding 30 days). The prototype *cannot* measure this. It tests an untested hypothesis: that clearer, grounded explanations may help investors make informed continuation decisions.

## What's in the app

| Route | What it does |
|---|---|
| `/` | Welcome: purpose, privacy boundaries, no account needed |
| `/concern` | **AI Concern Decoder**: concern chips or free text → screened, classified, grounded, validated explanation with sources and a "what was checked" panel |
| `/journey` | **SIP Journey Mirror**: labelled demo data or manual entry → total contributed, consistency, chart and table (contributions only, never returns) |
| `/market` | **Market Context Explainer**: contribution, market value, gain/loss (from a value *you* type), volatility (hypothetical unit arithmetic), time horizon |
| `/advice` | **Conflicting Advice Decoder**: up to 3 statements → checkable fact / opinion / assumption / unsupported claim, with "not verified" limitations |
| `/canvas` | **Decision Clarity Canvas**: concern, known facts, missing info, sourced considerations, reflection questions; no recommendation; session-only |
| `/payment` | **Payment Help**: failed instalment vs paused mandate vs stopped SIP, generic checklist, where to escalate; no live integrations |
| `/scenarios` | **Try 3 scenarios** for assessors (negative returns, ₹500 SIP, failed instalment), each with a safety demonstration |
| `/eval` | **Evaluation Lab**: anyone can run the 24-case suite, no token needed; see per-check results, red-team, human-review fields |
| `/insights` | Privacy-safe event counts, leading indicators, guardrails |
| `/about`, `/sources` | Research status, evidence separation, limitations; full source manifest |

## Quick start (local)

Requires Node.js 20.9+ (developed with Node 22 LTS).

```bash
npm install
cp .env.example .env.local     # optional: add GEMINI_API_KEY for live AI
npm run dev                    # http://localhost:3000
```

Without an API key the app runs in **educational demo mode**: every answer is preapproved, source-cited content selected by rules, and is labelled as such. No live AI generation is claimed.

## Commands

| Command | What it runs |
|---|---|
| `npm run dev` / `npm run build` / `npm start` | Next.js dev server / production build / production server |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm run lint` | ESLint (Next core-web-vitals + TypeScript) |
| `npm test` | Vitest: unit tests (calculations, safety rules, input screen, classifier, retrieval, KB integrity, docs in sync), integration tests (pipeline with a mocked model, API route handlers), the evaluation suite in demo mode, and the validator red-team |
| `npm run test:e2e` | Playwright against a production build in forced demo mode: three assessor scenarios, keyboard-only flow, error recovery, Canvas, Eval Lab, axe scans of every page (desktop and mobile), no horizontal overflow at phone width. Run `npx playwright install chromium` once and `npm run build` first. |
| `npm run eval` | Runs the 24 cases in demo mode and writes `docs/EVALUATION.md` and `docs/eval-results/demo.json` |
| `npm run eval:live` | Demo, then live mode with the configured model (3 to 6 minutes on the Gemini free tier) |
| `npm run docs:sources` | Regenerates `docs/SOURCES.md` and `docs/PROMPTS_AND_SAFETY.md` from the code (a unit test fails if they drift) |
| `npm run test:all` | typecheck + lint + unit/integration + build |

## Deploying to Vercel

1. Push the repository to GitHub (or use `vercel` CLI from this folder).
2. In Vercel, **Add New → Project**, import the repository. The framework is detected as Next.js; no build settings need changing.
3. Under **Settings → Environment Variables**, add (all server-side, never `NEXT_PUBLIC_`):
   - `GEMINI_API_KEY` for live AI (omit it to deploy in demo mode, or set `AI_MODE=demo`).
   - `RATE_LIMIT_SALT`: any random string. Each client can start 6 evaluation runs an hour, because a live run makes about 35 model calls against the shared quota.
4. **Recommended:** add the **Upstash Redis** integration from the Vercel Marketplace (Storage tab). It provides `KV_REST_API_URL` / `KV_REST_API_TOKEN`, which the app accepts. Without it, evaluation history, reviews and event counts are held in memory and reset on cold starts (the UI says so).
5. Deploy. Check `https://<your-app>/api/health`, which reports the mode, model and storage without exposing any secret.

`vercel.json` pins the Mumbai region (`bom1`). API routes set `maxDuration = 60`.

## Architecture in one paragraph

User text → **input screen** (mask identifiers; route distress / prompt injection / fund picks / predictions to preapproved responses) → **rule-based classifier** → **deterministic retrieval** of ≤4 passages from a versioned knowledge base of 9 verified public sources → **structured generation** (Gemini by default; Anthropic optional) constrained to those passages → **deterministic validation** (schema, citations exist and were retrieved, numbers grounded, lexical support estimate, 9 safety rules) → optional **AI judge** that can only block → otherwise a **preapproved fallback**. Every response carries safety metadata (checks, flags, versions, latency) that the UI shows in "What was checked". Details: [`docs/PROMPTS_AND_SAFETY.md`](docs/PROMPTS_AND_SAFETY.md).

## Documentation

- [`docs/ASSESSOR_WALKTHROUGH.md`](docs/ASSESSOR_WALKTHROUGH.md): a 5-minute guided tour
- [`docs/SOURCES.md`](docs/SOURCES.md): source and passage manifest (generated)
- [`docs/PROMPTS_AND_SAFETY.md`](docs/PROMPTS_AND_SAFETY.md): prompts, safety rules, fallback reasons, privacy (generated)
- [`docs/EVALUATION.md`](docs/EVALUATION.md): actual evaluation results (generated)
- [`docs/LIMITATIONS.md`](docs/LIMITATIONS.md): research status, evidence separation and limitations

## Configuration reference

See [`.env.example`](.env.example). Key switches: `AI_PROVIDER` (gemini | anthropic), `GEMINI_MODEL` (default `gemini-3.5-flash-lite`), `AI_MODE=demo`, `AI_JUDGE=off`, Upstash credentials.
