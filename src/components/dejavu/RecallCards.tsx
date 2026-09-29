import { Skeleton } from "@/components/ui/skeleton";
import type { RecalledMemory } from "@/lib/types";

export function RecallCards({ recalled, loading }: { recalled: RecalledMemory[]; loading: boolean }) {
  if (loading) {
    return (
      <div id="memories" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[118px] rounded-2xl" />
        ))}
      </div>
    );
  }

  if (recalled.length === 0) {
    return (
      <div
        id="memories"
        className="mt-4 rounded-3xl border border-dashed border-line bg-card p-6 text-center text-sm text-quiet"
      >
        No memories match this brief yet. Run it — the result gets retained and recalled next time.
      </div>
    );
  }

  return (
    <div id="memories" className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recalled.map((r, i) => {
        const m = r.memory;
        const win = m.outcome === "win";
        const rival = m.source === "competitor";
        return (
          <article
            key={m.id}
            className={`dv-rise rounded-2xl border p-4 ${
              rival
                ? "border-spark/50 bg-spark/5"
                : win
                  ? "border-win/40 bg-win/5"
                  : "border-flop/40 bg-flop/5"
            } ${i === 0 ? "dv-pulse" : ""}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase text-primary-foreground ${
                  win ? "bg-win" : "bg-flop"
                }`}
              >
                {win ? "Win" : "Flop"}
              </span>
              <span className="font-mono text-[11px] text-quiet">
                {rival ? `rival · ${m.competitor}` : m.festival}
              </span>
            </div>
            <p className="mt-2 font-display font-bold">“{m.hook}”</p>
            <p className="mt-2 text-[11px] text-quiet">
              {m.channel} · CTR{" "}
              <span className={`font-mono ${win ? "text-win" : "text-flop"}`}>{m.actualCtr.toFixed(1)}%</span> ·{" "}
              {Math.round(r.similarity * 100)}% match
            </p>
          </article>
        );
      })}
    </div>
  );
}
