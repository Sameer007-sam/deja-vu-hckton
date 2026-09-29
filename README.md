# Marketing Déjà Vu

An AI marketing agent with persistent memory. It recalls every campaign it has run for a brand —
wins, flops and logged rival campaigns — and uses them as context when a new brief arrives.

Built for HackwithHyderabad 3.0 (theme: AI agents with persistent memory).

## What it does

- **Campaign brief** — brand, audience, channel, festival/event, goal.
- **Memory-powered generation** — recalls similar past campaigns, then writes copy with those memories as context.
- **Déjà Vu Score + predicted CTR** — how strongly the brief matches history, and what CTR to expect.
- **Failure memory** — flops are retained and actively suppressed.
- **Explore vs exploit** — tries an untested angle when past hooks underperform.
- **Festival memory** — campaigns tagged Diwali, Bonalu, IPL, Sankranti, Ugadi and recalled a year later.
- **Multi-brand banks** — one isolated bank per client brand, no cross-brand leakage.
- **Competitor memory** — log rival campaigns; hooks they already win with get discounted.
- **Memory ON/OFF** — the same brief answered side by side, with and without history.
- **Reflect** — converts raw memories into plain-English insights.
- **Learning curve** — predicted vs actual CTR across rounds.
- **Explainability** — "Why this output?" lists exactly which memories influenced the copy.

## Memory layer

The memory layer is isolated behind three functions in `src/lib/memory.ts`: `retain()`, `recall()`
and `reflect()`. Banks are stored per anonymous browser session (`src/lib/store.ts`), so every
visitor gets an isolated memory bank and concurrent users never affect each other. Bank size is
capped, recall is pure and instant, and `Reset demo` restores the seeded 2025 campaigns for the
three demo brands (coffee, biryani restaurant, fashion).

Copywriting is the only networked step: a TanStack server function (`src/lib/copy.functions.ts`)
calls the Lovable AI Gateway with the recalled memories as context. If that service is slow,
rate limited or unavailable, the app falls back to a local template generator and shows an
"offline mode" badge — it never blanks out.

## Run locally

```bash
bun install
bun run dev
```

Open http://localhost:8080.

## Environment

No keys are required to run the app. The AI copywriting step uses `LOVABLE_API_KEY`, which the
platform provisions automatically; without it the app runs in offline (template) mode. Secrets are
read server-side only, never in browser code.

## Deploy

Publish from Lovable. The frontend is static-rendered and the copy endpoint is a stateless server
function, so it scales horizontally with no shared state.
