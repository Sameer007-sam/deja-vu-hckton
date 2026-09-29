import { useState } from "react";
import { Brain, Plus } from "lucide-react";
import { CHANNELS, FESTIVALS, type Memory } from "@/lib/types";

export function WhyPanel({ reasons }: { reasons: string[] }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] text-quiet uppercase">Why this output?</div>
      {reasons.length === 0 ? (
        <p className="mt-2 text-sm text-quiet">Run a brief to see exactly which memories shaped the copy.</p>
      ) : (
        <ul className="mt-2 space-y-1.5 text-xs">
          {reasons.map((r) => (
            <li key={r} className="flex gap-2">
              <span aria-hidden className="text-spark">
                •
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ReflectPanel({ insights, onReflect }: { insights: string[]; onReflect: () => void }) {
  return (
    <section className="mt-4 rounded-3xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">Reflect</h2>
        <button
          onClick={onReflect}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-bold transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Brain className="size-3.5" aria-hidden /> Turn memories into insights
        </button>
      </div>
      {insights.length === 0 ? (
        <p className="mt-3 text-sm text-quiet">
          Reflect reads this brand's whole bank and writes back what it has learned, in plain English.
        </p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {insights.map((i) => (
            <li key={i} className="dv-rise rounded-xl border border-spark/40 bg-spark/5 px-3 py-2">
              {i}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RetainResult({
  pending,
  onRetain,
}: {
  pending: { hook: string; predictedCtr: number } | null;
  onRetain: (actualCtr: number) => void;
}) {
  const [value, setValue] = useState("");
  if (!pending) return null;

  const num = Number(value);
  const valid = value !== "" && Number.isFinite(num) && num >= 0 && num <= 100;

  return (
    <section className="mt-4 rounded-3xl border border-win/40 bg-win/5 p-5">
      <h2 className="font-display text-lg font-bold">Close the loop</h2>
      <p className="mt-1 text-sm text-quiet">
        “{pending.hook}” shipped with a predicted CTR of {pending.predictedCtr.toFixed(1)}%. Enter what actually
        happened and the agent retains it — win or flop.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="text-xs">
          <span className="sr-only">Actual CTR percentage</span>
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))}
            placeholder="Actual CTR %"
            className="w-36 rounded-xl border border-line bg-card px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </label>
        <button
          disabled={!valid}
          onClick={() => onRetain(num)}
          className="rounded-full bg-ink px-5 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Retain result
        </button>
        <button
          onClick={() => onRetain(pending.predictedCtr)}
          className="rounded-full border border-line px-4 py-2 text-xs font-medium hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Use predicted
        </button>
      </div>
    </section>
  );
}

export function CompetitorForm({
  brandId,
  onLog,
}: {
  brandId: string;
  onLog: (memory: Omit<Memory, "id" | "createdAt">) => void;
}) {
  const [open, setOpen] = useState(false);
  const [competitor, setCompetitor] = useState("");
  const [hook, setHook] = useState("");
  const [festival, setFestival] = useState<string>("Diwali");
  const [channel, setChannel] = useState<string>("Instagram Reels");
  const [ctr, setCtr] = useState("");

  const ctrNum = Number(ctr);
  const valid = competitor.trim() && hook.trim() && ctr !== "" && Number.isFinite(ctrNum);

  const submit = () => {
    if (!valid) return;
    onLog({
      brandId,
      hook: hook.trim(),
      body: `Logged rival campaign by ${competitor.trim()}.`,
      audience: "rival audience",
      channel,
      festival,
      goal: "Awareness",
      predictedCtr: null,
      actualCtr: ctrNum,
      outcome: ctrNum >= 2.5 ? "win" : "flop",
      source: "competitor",
      competitor: competitor.trim(),
      year: new Date().getFullYear(),
    });
    setCompetitor("");
    setHook("");
    setCtr("");
    setOpen(false);
  };

  const field =
    "w-full rounded-xl border border-line bg-card px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <section className="mt-4 rounded-3xl border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Competitor memory</h2>
          <p className="mt-1 text-sm text-quiet">
            Hooks a rival already wins with get discounted; their flops are learned from for free.
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-xs font-bold transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Plus className="size-3.5" aria-hidden /> Log rival campaign
        </button>
      </div>

      {open && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className={field}
            placeholder="Rival brand"
            value={competitor}
            maxLength={40}
            onChange={(e) => setCompetitor(e.target.value)}
          />
          <input
            className={`${field} lg:col-span-2`}
            placeholder="Their hook"
            value={hook}
            maxLength={120}
            onChange={(e) => setHook(e.target.value)}
          />
          <select className={field} value={festival} onChange={(e) => setFestival(e.target.value)}>
            {FESTIVALS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <select className={field} value={channel} onChange={(e) => setChannel(e.target.value)}>
            {CHANNELS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            className={field}
            placeholder="Their CTR %"
            inputMode="decimal"
            value={ctr}
            onChange={(e) => setCtr(e.target.value.replace(/[^0-9.]/g, "").slice(0, 5))}
          />
          <button
            disabled={!valid}
            onClick={submit}
            className="rounded-full bg-spark px-5 py-2 text-xs font-bold text-ink disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Retain rival memory
          </button>
        </div>
      )}
    </section>
  );
}
