import { Skeleton } from "@/components/ui/skeleton";
import { WifiOff } from "lucide-react";
import type { GenerationResult } from "@/lib/types";

export function Comparison({
  result,
  loading,
  memoryOn,
}: {
  result: GenerationResult | null;
  loading: boolean;
  memoryOn: boolean;
}) {
  if (loading) {
    return (
      <div id="compare" className="mt-4 grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <div
        id="compare"
        className="mt-4 rounded-3xl border border-dashed border-line bg-card p-6 text-center text-sm text-quiet"
      >
        Run a brief to see the same request answered with and without memory, side by side.
      </div>
    );
  }

  return (
    <div id="compare" className="mt-4 grid gap-3 lg:grid-cols-2">
      <article className="dv-rise rounded-2xl border border-line bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] tracking-wider text-quiet uppercase">Memory OFF</span>
          <span className="font-mono text-sm text-flop">{result.withoutMemory.predictedCtr.toFixed(1)}%</span>
        </div>
        <p className="mt-2 font-display font-bold text-quiet">“{result.withoutMemory.hook}”</p>
        <p className="mt-1 text-sm text-quiet">{result.withoutMemory.body}</p>
      </article>

      <article
        className={`dv-rise rounded-2xl border-2 bg-card p-4 ${memoryOn ? "border-win" : "border-dashed border-line opacity-60"}`}
        style={{ animationDelay: "120ms" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-mono text-[11px] tracking-wider uppercase text-win">Memory ON</span>
          <div className="flex items-center gap-2">
            {result.offline && (
              <span className="inline-flex items-center gap-1 rounded-full border border-spark/50 bg-spark/10 px-2 py-0.5 text-[10px] font-medium">
                <WifiOff className="size-3" aria-hidden /> offline mode
              </span>
            )}
            <span className="rounded-full bg-soft px-2 py-0.5 text-[10px] font-medium tracking-wider uppercase">
              {result.strategy}
            </span>
            <span className="font-mono text-sm text-win">{result.withMemory.predictedCtr.toFixed(1)}%</span>
          </div>
        </div>
        <p className="mt-2 font-display font-bold">“{result.withMemory.hook}”</p>
        <p className="mt-1 text-sm">{result.withMemory.body}</p>
      </article>
    </div>
  );
}
