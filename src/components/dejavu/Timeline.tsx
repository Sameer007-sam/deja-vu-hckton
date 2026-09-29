import type { Memory } from "@/lib/types";

export function Timeline({ memories, recalledIds }: { memories: Memory[]; recalledIds: Set<string> }) {
  const ordered = [...memories].sort((a, b) => a.createdAt - b.createdAt);

  if (ordered.length === 0) {
    return <p className="mt-3 text-sm text-quiet">This bank is empty. Every run adds a node here.</p>;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {ordered.map((m) => {
        const hit = recalledIds.has(m.id);
        const tone = hit
          ? m.outcome === "win"
            ? "border-win bg-win/10 text-win"
            : "border-flop bg-flop/10 text-flop"
          : "border-line text-quiet";
        return (
          <span
            key={m.id}
            title={`${m.hook} — ${m.actualCtr.toFixed(1)}% CTR`}
            className={`dv-rise rounded-full border px-3 py-1 text-xs ${tone} ${hit ? "font-medium" : ""}`}
          >
            {m.year} {m.festival === "No festival" ? m.channel : m.festival}
            {hit ? " ↺" : ""}
          </span>
        );
      })}
    </div>
  );
}
