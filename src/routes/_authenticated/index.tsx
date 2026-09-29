import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import { ImportHistory } from "@/components/dejavu/ImportHistory";

import { addMemories, addMemory, createBrand, fetchBank, MEMORY_CAP, resetDemo, seedDemo, signOut } from "@/lib/db";
import { markTourSeen, tourSeen } from "@/lib/store";
import { dejaVuScore, localDraft, plan, recall, reflect, withoutMemoryDraft } from "@/lib/memory";
import { generateCopy } from "@/lib/copy.functions";
import type { Brand, Brief, GenerationResult, Memory } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/")({
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

const SAMPLE: Record<string, Omit<Brief, "brandId">> = {
  "Kopi Kulture": { audience: "18-34, tier-2 cities", channel: "Instagram Reels", festival: "Diwali", goal: "First-order lift" },
  "Biryani Bhai": { audience: "families, 25-50, Hyderabad", channel: "WhatsApp", festival: "Eid", goal: "Footfall" },
  "Sari & Sole": { audience: "women 24-40, metros", channel: "Instagram Reels", festival: "Diwali", goal: "First-order lift" },
};

function sampleFor(brand?: Brand): Brief {
  const s = (brand && SAMPLE[brand.name]) ?? {
    audience: "18-34",
    channel: "Instagram Reels",
    festival: "Diwali",
    goal: "First-order lift",
  };
  return { brandId: brand?.id ?? "", ...s };
}

function Dashboard() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loadingBank, setLoadingBank] = useState(true);
  const [brandId, setBrandId] = useState("");
  const [brief, setBrief] = useState<Brief>(sampleFor());
  const [memoryOn, setMemoryOn] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [pending, setPending] = useState<{ hook: string; body: string; predictedCtr: number } | null>(null);
  const [tour, setTour] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let bank = await fetchBank();
        if (bank.brands.length === 0) bank = await seedDemo();
        if (cancelled) return;
        setBrands(bank.brands);
        setMemories(bank.memories);
        const first = bank.brands[0];
        if (first) {
          setBrandId(first.id);
          setBrief(sampleFor(first));
        }
        if (!tourSeen()) setTour(true);
      } catch {
        if (!cancelled) toast.error("Could not load your memory banks. Please refresh.");
      } finally {
        if (!cancelled) setLoadingBank(false);
      }
    })();
    const stored = window.localStorage.getItem("dejavu.theme");
    if (stored === "dark" || stored === "light") setTheme(stored);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("dejavu.theme", theme);
  }, [theme]);

  const brand = brands.find((b) => b.id === brandId) ?? brands[0];

  const bank = useMemo(() => memories.filter((m) => m.brandId === brand?.id), [memories, brand]);
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
    if (running || !brand) return;
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
    setBrief(sampleFor(brand));
    setMemoryOn(true);
    setTimeout(() => void run(), 60);
  };

  const retainResult = async (actualCtr: number) => {
    if (!pending || !brand) return;
    try {
      const saved = await addMemory(brand.id, {
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
      });
      setMemories((all) => [saved, ...all]);
      setPending(null);
      toast.success(
        actualCtr >= 2.5 ? "Retained as a win — it will be recalled next time." : "Retained as a flop — it will be avoided.",
      );
    } catch {
      toast.error("Could not save that result. Please try again.");
    }
  };

  const logRival = async (partial: Omit<Memory, "id" | "createdAt">) => {
    try {
      const saved = await addMemory(partial.brandId, {
        hook: partial.hook,
        body: partial.body,
        audience: partial.audience,
        channel: partial.channel,
        festival: partial.festival,
        goal: partial.goal,
        predictedCtr: partial.predictedCtr,
        actualCtr: partial.actualCtr,
        outcome: partial.outcome,
        source: "competitor",
        competitor: partial.competitor,
        year: partial.year,
      });
      setMemories((all) => [saved, ...all]);
      toast.success("Rival campaign retained in this brand's bank.");
    } catch {
      toast.error("Could not save that rival campaign. Please try again.");
    }
  };

  if (loadingBank || !brand) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background font-body text-foreground">
        <p className="text-sm text-quiet">Opening your memory banks…</p>
      </div>
    );
  }

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
          brands={brands}
          brand={brand}
          onBrand={(id) => {
            setBrandId(id);
            setBrief(sampleFor(brands.find((b) => b.id === id)));
            setResult(null);
            setPending(null);
            setInsights([]);
          }}
          onNewBrand={async (name, tone, industry) => {
            try {
              const created = await createBrand(name, tone, industry);
              setBrands((all) => [...all, created]);
              setBrandId(created.id);
              setBrief(sampleFor(created));
              setResult(null);
              setPending(null);
              setInsights([]);
              toast.success(`${created.name} has its own memory bank now.`);
            } catch {
              toast.error("Could not create that brand. Please try again.");
            }
          }}
          dejaVu={result?.dejaVuScore ?? live.dejaVu}
          predictedCtr={result?.withMemory.predictedCtr ?? live.predicted}
          counts={counts}
          theme={theme}
          onTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
          onReset={() => {
            void (async () => {
              try {
                const bank = await resetDemo();
                setBrands(bank.brands);
                setMemories(bank.memories);
                const first = bank.brands[0];
                if (first) {
                  setBrandId(first.id);
                  setBrief(sampleFor(first));
                }
                setResult(null);
                setPending(null);
                setInsights([]);
                toast.success("Demo reset — three brands, 2025 campaigns and rival logs restored.");
              } catch {
                toast.error("Could not reset the demo. Please try again.");
              }
            })();
          }}
          onReplayTour={() => setTour(true)}
          onSignOut={() => {
            void signOut().then(() => navigate({ to: "/auth" }));
          }}
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

          <RetainResult pending={pending} onRetain={(ctr) => void retainResult(ctr)} />

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

          <ReflectPanel insights={insights} onReflect={() => setInsights(reflect(memories, brand.id))} />
          <ImportHistory
            brand={brand}
            existing={bank}
            totalCount={memories.length}
            onImport={(rows) => {
              void (async () => {
                if (memories.length + rows.length > MEMORY_CAP) {
                  toast.error(`The memory bank holds ${MEMORY_CAP} campaigns across all brands.`);
                  return;
                }
                try {
                  const saved = await addMemories(
                    brand.id,
                    rows.map((row) => ({
                      hook: row.hook,
                      body: row.body,
                      audience: row.audience,
                      channel: row.channel,
                      festival: row.festival,
                      goal: row.goal,
                      predictedCtr: row.predictedCtr,
                      actualCtr: row.actualCtr,
                      outcome: row.outcome,
                      source: row.source,
                      ...(row.competitor ? { competitor: row.competitor } : {}),
                      year: row.year,
                    })),
                  );
                  const next = [...saved, ...memories];
                  setMemories(next);
                  setInsights(reflect(next, brand.id));
                  setResult(null);
                  setPending(null);
                  toast.success(`${rows.length} campaigns added to ${brand.name}. Insights updated.`);
                } catch {
                  toast.error("Could not save the imported campaigns. Please try again.");
                }
              })();
            }}
          />
          <CompetitorForm brandId={brand.id} onLog={(partial) => void logRival(partial)} />

          <footer className="mt-8 pb-4 text-center text-xs text-quiet">
            Built for HackwithHyderabad 3.0 · your banks live in your own cloud database ({counts.retained} retained)
          </footer>
        </main>
      </div>
    </div>
  );
}
