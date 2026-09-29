import { Link } from "@tanstack/react-router";
import { LogOut, Moon, Plus, RotateCcw, Sun } from "lucide-react";
import { useState } from "react";
import type { Brand } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "./Info";

const DOTS = ["bg-win", "bg-spark", "bg-flop"];

interface Props {
  brands: Brand[];
  brand: Brand;
  onBrand: (id: string) => void;
  onNewBrand: (name: string, tone: string, industry: string) => Promise<void>;
  dejaVu: number;
  predictedCtr: number;
  counts: { retained: number; wins: number; flops: number };
  theme: "light" | "dark";
  onTheme: () => void;
  onReset: () => void;
  onReplayTour: () => void;
  onSignOut: () => void;
}

export function Sidebar({
  brands,
  brand,
  onBrand,
  onNewBrand,
  dejaVu,
  predictedCtr,
  counts,
  theme,
  onTheme,
  onReset,
  onReplayTour,
  onSignOut,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState("");
  const [saving, setSaving] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !name.trim()) return;
    setSaving(true);
    try {
      await onNewBrand(name.trim(), tone.trim(), industry.trim());
      setOpen(false);
      setName("");
      setIndustry("");
      setTone("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="w-full shrink-0 border-line p-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:overflow-y-auto lg:border-r">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-2xl font-extrabold">
            Déjà <span className="text-spark">Vu</span>
          </div>
          <div className="mt-1 text-[10px] tracking-[0.2em] text-quiet uppercase">memory-first marketing</div>
        </div>
        <button
          onClick={onTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="rounded-full border border-line p-2 text-quiet transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {theme === "dark" ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
        </button>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.18em] text-quiet uppercase">Memory banks</span>
        <button
          onClick={() => setOpen(true)}
          aria-label="Create a new brand"
          className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-1 text-[11px] font-medium text-quiet transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Plus className="size-3" aria-hidden /> New brand
        </button>
      </div>
      <div role="radiogroup" aria-label="Brand memory bank" className="mt-2 flex flex-col gap-2">
        {brands.map((b, i) => {
          const active = b.id === brand.id;
          return (
            <button
              key={b.id}
              role="radio"
              aria-checked={active}
              onClick={() => onBrand(b.id)}
              className={`flex items-center gap-2 rounded-full px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                active
                  ? "bg-win font-medium text-primary-foreground"
                  : "border border-line text-ink hover:bg-soft"
              }`}
            >
              <span className={`size-2 shrink-0 rounded-full ${active ? "bg-paper/80" : DOTS[i % DOTS.length]}`} />
              {b.name}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-quiet">
        Banks are fully isolated — nothing recalled here leaks into another brand.
      </p>

      <div className="mt-5 flex items-center gap-1 text-[10px] tracking-[0.18em] text-quiet uppercase">
        Recall
        <Info label="Déjà Vu Score">
          Déjà Vu Score = how strongly this brief matches past campaigns (festival, channel, audience and goal
          overlap). 100 means the agent has seen this exact brief before.
        </Info>
      </div>
      <div className="mt-2 rounded-2xl border border-win/40 bg-win/5 p-3">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-[11px] text-quiet">Déjà Vu</span>
          <span className="font-display text-3xl font-extrabold text-win">{dejaVu}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-soft">
          <div className="dv-grow h-2 rounded-full bg-win" style={{ width: `${dejaVu}%` }} />
        </div>
        <div className="mt-2 flex items-center gap-1 text-[11px] text-quiet">
          pred. CTR <span className="font-mono text-ink">{predictedCtr.toFixed(1)}%</span>
          <Info label="CTR">CTR = clicks ÷ impressions × 100. Predicted CTR is estimated from recalled memories.</Info>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "retained", value: counts.retained, tone: "text-ink" },
          { label: "wins", value: counts.wins, tone: "text-win" },
          { label: "flops", value: counts.flops, tone: "text-flop" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-line px-1 py-2">
            <dd className={`font-display text-lg font-bold ${s.tone}`}>{s.value}</dd>
            <dt className="text-[10px] tracking-[0.12em] text-quiet uppercase">{s.label}</dt>
          </div>
        ))}
      </dl>

      <nav aria-label="Sections" className="mt-5 flex flex-col gap-1 text-sm text-quiet">
        <a className="rounded-lg px-2 py-1.5 hover:text-ink" href="#brief">
          Brief
        </a>
        <a className="rounded-lg px-2 py-1.5 hover:text-ink" href="#memories">
          Memories
        </a>
        <a className="rounded-lg px-2 py-1.5 hover:text-ink" href="#compare">
          With / without memory
        </a>
        <a className="rounded-lg px-2 py-1.5 hover:text-ink" href="#timeline">
          Timeline &amp; learning
        </a>
        <a className="rounded-lg px-2 py-1.5 hover:text-ink" href="#import-history">
          Import history
        </a>
        <Link className="rounded-lg px-2 py-1.5 hover:text-ink" to="/how-it-works">
          How it works
        </Link>
      </nav>

      <div className="mt-5 flex flex-col gap-2">
        <button
          onClick={onReplayTour}
          className="rounded-full border border-line px-3 py-2 text-xs font-medium transition-colors hover:bg-soft focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Replay tour
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-medium text-quiet transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Reset demo
        </button>
        <button
          onClick={onSignOut}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs font-medium text-quiet transition-colors hover:bg-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <LogOut className="size-3.5" aria-hidden /> Sign out
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New brand memory bank</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void create(e)} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="brand-name">Brand name</Label>
              <Input id="brand-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Filter Coffee Co." />
            </div>
            <div>
              <Label htmlFor="brand-industry">Industry</Label>
              <Input id="brand-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Specialty coffee" />
            </div>
            <div>
              <Label htmlFor="brand-tone">Tone of voice</Label>
              <Input id="brand-tone" value={tone} onChange={(e) => setTone(e.target.value)} placeholder="warm, witty, ritual-led" />
            </div>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Creating…" : "Create bank"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
