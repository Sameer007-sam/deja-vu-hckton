import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Marketing Déjà Vu works — memory architecture" },
      {
        name: "description",
        content:
          "The retain / recall / reflect memory loop behind Marketing Déjà Vu, plus the scoring, explore-vs-exploit policy and reliability model.",
      },
      { property: "og:title", content: "How Marketing Déjà Vu works" },
      {
        property: "og:description",
        content: "Retain, recall, reflect: the memory architecture behind the marketing agent that remembers.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

const DIAGRAM = `  Campaign brief ──▶ recall()  ──▶ ranked memories ──▶ policy
                       │                                │
                       │                       exploit ─┴─ explore
                       ▼                                │
              per-brand memory bank                     ▼
              (wins · flops · rivals)          copy generator (AI)
                       ▲                                │
                       │                         offline fallback
                       └──── retain() ◀── actual CTR ◀───┘
                       │
                       └──── reflect() ──▶ plain-English insights`;

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <main className="mx-auto max-w-3xl px-5 py-12">
        <Link to="/" className="font-mono text-xs text-quiet hover:text-ink">
          ← back to dashboard
        </Link>
        <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight text-balance">
          How Marketing Déjà Vu works
        </h1>
        <p className="mt-3 text-pretty text-quiet">
          The agent keeps one memory bank per client brand. Every campaign it writes, and every result you record,
          becomes a memory it can recall the next time a similar brief arrives.
        </p>

        <section className="mt-8 rounded-3xl border border-line bg-card p-5">
          <h2 className="font-display text-lg font-bold">Architecture</h2>
          <pre className="mt-3 overflow-x-auto font-mono text-[11px] leading-relaxed text-quiet">{DIAGRAM}</pre>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              t: "retain()",
              d: "Stores the brief, the copy, the predicted CTR and the real CTR. Anything under 2.5% CTR is tagged a flop.",
            },
            {
              t: "recall()",
              d: "Ranks the brand's memories by festival, channel, audience and goal overlap. Only that brand's bank is searched.",
            },
            {
              t: "reflect()",
              d: "Summarises the bank into insights: best channel, best festival, recurring failure patterns.",
            },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl border border-line bg-card p-4">
              <div className="font-mono text-sm font-medium text-spark">{x.t}</div>
              <p className="mt-2 text-sm text-quiet">{x.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 space-y-4">
          <div>
            <h2 className="font-display text-lg font-bold">Déjà Vu Score and predicted CTR</h2>
            <p className="mt-1 text-sm text-quiet">
              The Déjà Vu Score blends the best single match (70%) with the average of the top three (30%). Predicted
              CTR is a similarity-weighted average of past winners, reduced when a similar campaign flopped and
              reduced again when a rival already owns the hook. CTR itself is clicks ÷ impressions × 100.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Explore vs exploit</h2>
            <p className="mt-1 text-sm text-quiet">
              When a strong past winner matches the brief, the agent exploits it. When the closest winner is tired
              (under 2.6% CTR) or there are no winners at all, it explores a fresh angle instead of repeating a
              fading hook.
            </p>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Reliability</h2>
            <p className="mt-1 text-sm text-quiet">
              Every visitor gets an isolated memory bank keyed to an anonymous session, so concurrent users never
              affect each other. The memory layer is local and instant; only copywriting calls the AI service, and if
              that service is slow or unavailable the app falls back to a local template generator and shows an
              “offline mode” badge. Inputs are validated and capped, buttons disable while a request runs, and bank
              size is capped so nothing grows without bound.
            </p>
          </div>
        </section>

        <Link
          to="/"
          className="mt-8 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Try it with the sample demo
        </Link>
      </main>
    </div>
  );
}
