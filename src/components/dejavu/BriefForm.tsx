import { Loader2, Sparkles } from "lucide-react";
import { CHANNELS, FESTIVALS, GOALS, type Brief } from "@/lib/types";
import { Info } from "./Info";

interface Props {
  brief: Brief;
  onChange: (patch: Partial<Brief>) => void;
  onRun: () => void;
  running: boolean;
  memoryOn: boolean;
  onMemory: (v: boolean) => void;
}

const field =
  "mt-1 w-full rounded-xl border border-line bg-card px-3 py-2 text-sm text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function BriefForm({ brief, onChange, onRun, running, memoryOn, onMemory }: Props) {
  return (
    <section id="brief" className="mt-4 rounded-3xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Campaign brief</h2>
        <label className="flex cursor-pointer items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-mono tracking-wider text-quiet uppercase">
            Memory {memoryOn ? "ON" : "OFF"}
            <Info label="memory">
              retain = store a result, recall = find similar past campaigns, reflect = turn memories into insights.
              Switch memory off to see the same brief answered with no history at all.
            </Info>
          </span>
          <input
            type="checkbox"
            checked={memoryOn}
            onChange={(e) => onMemory(e.target.checked)}
            className="peer sr-only"
            aria-label="Use memory when generating"
          />
          <span className="relative h-5 w-9 rounded-full bg-line transition-colors peer-checked:bg-win peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
            <span className="absolute top-0.5 left-0.5 size-4 rounded-full bg-card transition-transform peer-checked:translate-x-4" />
          </span>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs">
          <span className="text-quiet">Channel</span>
          <select className={field} value={brief.channel} onChange={(e) => onChange({ channel: e.target.value })}>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-quiet">Audience</span>
          <input
            className={field}
            value={brief.audience}
            maxLength={120}
            onChange={(e) => onChange({ audience: e.target.value })}
            placeholder="18–34, tier-2 cities"
          />
        </label>
        <label className="text-xs">
          <span className="text-quiet">Festival / event</span>
          <select
            className={`${field} bg-spark/10`}
            value={brief.festival}
            onChange={(e) => onChange({ festival: e.target.value })}
          >
            {FESTIVALS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          <span className="text-quiet">Goal</span>
          <select className={field} value={brief.goal} onChange={(e) => onChange({ goal: e.target.value })}>
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        onClick={onRun}
        disabled={running || brief.audience.trim().length === 0}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-spark px-6 py-2.5 text-sm font-bold text-ink ring-1 ring-black/5 transition-opacity disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {running ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
        {running ? "Recalling…" : "Run / Generate"}
      </button>
    </section>
  );
}
