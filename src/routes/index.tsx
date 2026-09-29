import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PlayCircle } from "lucide-react";

import { Sidebar } from "@/components/dejavu/Sidebar";
import { BriefForm } from "@/components/dejavu/BriefForm";
import { RecallCards } from "@/components/dejavu/RecallCards";
import { Comparison } from "@/components/dejavu/Comparison";
import { Timeline } from "@/components/dejavu/Timeline";
import { LearningCurve } from "@/components/dejavu/LearningCurve";
import { CompetitorForm, ReflectPanel, RetainResult, WhyPanel } from "@/components/dejavu/Panels";
import { Tour } from "@/components/dejavu/Tour";
import { Info } from "@/components/dejavu/Info";

import { BRANDS } from "@/lib/seed";
import { loadMemories, markTourSeen, resetDemo, saveMemories, tourSeen } from "@/lib/store";
import { dejaVuScore, localDraft, plan, recall, reflect, withoutMemoryDraft } from "@/lib/memory";
import { generateCopy } from "@/lib/copy.functions";
import type { Brief, GenerationResult, Memory } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marketing Déjà Vu — the marketing agent that remembers" },
      {
        name: "description",
        content:
          "An AI marketing agent with persistent memory: it recalls every campaign it has run, avoids past flops, and shows the difference between memory on and memory off.",
      },
      { property: "og:title", content: "Marketing Déjà Vu — the marketing agent that remembers" },
      {
        property: "og:description",
        content:
          "Recall past campaigns, score the déjà vu, predict CTR, and watch the agent learn round after round.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const SAMPLE: Record<string, Brief> = {
  kopi: { brandId: "kopi", audience: "18-34, tier-2 cities", channel: "Instagram Reels", festival: "Diwali", goal: "First-order lift" },
  biryani: { brandId: "biryani", audience: "families, 25-50, Hyderabad", channel: "WhatsApp", festival: "Eid", goal: "Footfall" },
  sari: { brandId: "sari", audience: "women 24-40, metros", channel: "Instagram Reels", festival: "Diwali", goal: "First-order lift" },
};

function Dashboard() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [brandId, setBrandId] = useState("kopi");
  const [brief, setBrief] = useState<Brief>(SAMPLE.kopi!);
  const [memoryOn, setMemoryOn] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [pending, setPending] = useState<{ hook: string; body: string; predictedCtr: number } | null>(null);
  const [tour, setTour] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0]!;

  useEffect(() => {
    setMemories(loadMemories());
    if (!tourSeen()) setTour(true);
    const stored = window.localStorage.getItem("dejavu.theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("dejavu.theme", theme);
  }, [theme]);

  const bank = useMemo(() => memories.filter((m) => m.brandId === brandId), [memories, brandId]);
  const counts = useMemo(
    () => ({
      retained: bank.length,
      wins: bank.filter((m) => m.outcome === "win").length,
      flops: bank.filter((m) => m.outcome === "flop").length,
    }),
    [bank],
  );

  const live = useMemo(() => {
    const recalled = memoryOn ? recall(memories, brief) : [];
    return { recalled, dejaVu: dejaVuScore(recalled), predicted: plan(brief, recalled).predictedCtr };
  }, [memories, brief, memoryOn]);

  const recalledIds = useMemo(
    () => new Set((result?.recalled ?? live.recalled).map((r) => r.memory.id)),
    [result, live.recalled],
  );

  const run = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setResult(null);
    setPending(null);
    try {
      const recalled = memoryOn ? recall(memories, brief) : [];
      const p = plan(brief, recalled);
      const noMemory = withoutMemoryDraft(brief, brand.name);

      let draft = memoryOn ? localDraft(brief, brand.name, p) : { ...noMemory };
      let offline = true;

      if (memoryOn) {
        const res = await generateCopy({
          data: {
            brandName: brand.name,
            brandTone: brand.tone,
            audience: brief.audience,
            channel: brief.channel,
            festival: brief.festival,
            goal: brief.goal,
            strategy: p.strategy,
            winningHooks: p.winningHooks.slice(0, 3).map((r) => r.memory.hook),
            avoidHooks: p.avoidHooks.slice(0, 3).map((r) => r.memory.hook),
            rivalHooks: p.rivalHooks.slice(0, 3).map((r) => r.memory.hook),
          },
        });
        if (res.ok) {
          draft = { hook: res.hook, body: res.body, predictedCtr: p.predictedCtr };
          offline = false;
        } else {
          toast.warning("Writing from local templates", {
            description: res.error ?? "The AI service is unavailable right now.",
          });
        }
      }

      const generated: GenerationResult = {
        brief,
        withoutMemory: noMemory,
        withMemory: draft,
        dejaVuScore: dejaVuScore(recalled),
        strategy: p.strategy,
        recalled,
        reasons: memoryOn ? p.reasons : ["Memory is switched off — the agent starts from a blank prompt every time."],
        offline,
        createdAt: Date.now(),
      };
      setResult(generated);
      if (memoryOn) setPending(draft);
      toast.success(
        memoryOn
          ? `Recalled ${recalled.length} memories · Déjà Vu ${generated.dejaVuScore}`
          : "Generated without memory",
      );
    } catch {
      toast.error("Something went wrong generating that brief. Please try again.");
    } finally {
      setRunning(false);
    }
  }, [brand, brief, memories, memoryOn, running]);

  const runSample = () => {
    const sample = SAMPLE[brandId] ?? SAMPLE.kopi!;
    setBrief(sample);
    setMemoryOn(true);
    setTimeout(() => void run(), 60);
  };

  const retainResult = (actualCtr: number) => {
    if (!pending) return;
    const memory: Memory = {
      id: `m_${Date.now()}`,
      brandId,
      hook: pending.hook,
      body: pending.body,
      audience: brief.audience,
      channel: brief.channel,
      festival: brief.festival,
      goal: brief.goal,
      predictedCtr: pending.predictedCtr,
      actualCtr,
      outcome: actualCtr >= 2.5 ? "win" : "flop",
      source: "own",
      year: new Date().getFullYear(),
      createdAt: Date.now(),
    };
    const next = [memory, ...memories];
    setMemories(next);
    saveMemories(next);
    setPending(null);
    toast.success(
      actualCtr >= 2.5 ? "Retained as a win — it will be recalled next time." : "Retained as a flop — it will be avoided.",
    );
  };

  const logRival = (partial: Omit<Memory, "id" | "createdAt">) => {
    const next = [{ ...partial, id: `c_${Date.now()}`, createdAt: Date.now() }, ...memories];
    setMemories(next);
    saveMemories(next);
    toast.success("Rival campaign retained in this brand's bank.");
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Tour
        open={tour}
        onClose={() => {
          setTour(false);
          markTourSeen();
        }}
      />
      <div className="flex flex-col lg:flex-row">
        <Sidebar
          brand={brand}
          onBrand={(id) => {
            setBrandId(id);
            setBrief(SAMPLE[id] ?? { ...brief, brandId: id });
            setResult(null);
            setPending(null);
            setInsights([]);
          }}
          dejaVu={result?.dejaVuScore ?? live.dejaVu}
          predictedCtr={result?.withMemory.predictedCtr ?? live.predicted}
          counts={counts}
          theme={theme}
          onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onReset={() => {
            const seeded = resetDemo();
            setMemories(seeded);
            setResult(null);
            setPending(null);
            setInsights([]);
            toast.success("Demo reset — three brands, 2025 campaigns and rival logs restored.");
          }}
          onReplayTour={() => setTour(true)}
        />

        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
          <section className="dv-rise relative overflow-hidden rounded-3xl border border-line bg-soft p-6">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-8 -right-6 font-display text-[120px] leading-none font-extrabold text-spark/20 select-none"
            >
              ↺
            </div>
            <h1 className="max-w-[22ch] font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Your next campaign already has a memory.
            </h1>
            <p className="mt-2 max-w-[48ch] text-pretty text-quiet">
              Marketing Déjà Vu recalls every past brief, win and flop for {brand.name} — then writes copy that
              already knows the audience.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={runSample}
                disabled={running}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-primary-foreground ring-1 ring-black/5 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <PlayCircle className="size-4" aria-hidden /> Run sample demo
              </button>
              <Link
                to="/how-it-works"
                className="rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                How it works
              </Link>
            </div>
          </section>

          <BriefForm
            brief={brief}
            onChange={(patch) => setBrief({ ...brief, ...patch })}
            onRun={() => void run()}
            running={running}
            memoryOn={memoryOn}
            onMemory={setMemoryOn}
          />

          <div className="mt-6 flex items-center gap-1 text-[10px] tracking-[0.18em] text-quiet uppercase">
            Recalled memories
            <Info label="recall">
              Recall searches only this brand's bank, ranking past campaigns by festival, channel, audience and goal
              overlap.
            </Info>
          </div>
          <RecallCards recalled={result?.recalled ?? live.recalled} loading={running} />

          <div className="mt-6 text-[10px] tracking-[0.18em] text-quiet uppercase">Same brief, two agents</div>
          <Comparison result={result} loading={running} memoryOn={memoryOn} />

          <RetainResult pending={pending} onRetain={retainResult} />

          <section id="timeline" className="mt-4 rounded-3xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-bold">Memory timeline</h2>
            <Timeline memories={bank} recalledIds={recalledIds} />
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-1 text-[10px] tracking-[0.18em] text-quiet uppercase">
                  Learning curve · predicted vs actual CTR
                  <Info label="CTR">CTR = clicks ÷ impressions × 100.</Info>
                </div>
                <LearningCurve memories={bank} />
              </div>
              <WhyPanel reasons={result?.reasons ?? []} />
            </div>
          </section>

          <ReflectPanel insights={insights} onReflect={() => setInsights(reflect(memories, brandId))} />
          <CompetitorForm brandId={brandId} onLog={logRival} />

          <footer className="mt-8 pb-4 text-center text-xs text-quiet">
            Built for HackwithHyderabad 3.0 · memories live in your own browser bank ({counts.retained} retained)
          </footer>
        </main>
      </div>
    </div>
  );
}
