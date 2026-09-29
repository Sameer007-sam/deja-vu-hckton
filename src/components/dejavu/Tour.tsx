import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

const STEPS = [
  {
    title: "1 · Brief",
    body: "Describe the campaign: brand, audience, channel, festival and goal. Each brand has its own isolated memory bank.",
  },
  {
    title: "2 · Recall",
    body: "The agent searches that bank for similar past campaigns and scores the match — the Déjà Vu Score. Wins are reused, flops are suppressed, rival-owned hooks are discounted.",
  },
  {
    title: "3 · Generate",
    body: "Copy is written twice: once with no memory, once using the recalled campaigns as context. The difference is the whole point.",
  },
  {
    title: "4 · Learn",
    body: "Record what actually happened. The result is retained, the learning curve updates, and Reflect turns raw memories into plain-English insights.",
  },
];

export function Tour({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[Math.min(step, STEPS.length - 1)]!;
  const last = step === STEPS.length - 1;

  const close = () => {
    setStep(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-md rounded-3xl">
        <div className="text-[10px] tracking-[0.2em] text-quiet uppercase">Guided tour</div>
        <DialogTitle className="font-display text-2xl font-extrabold">{current.title}</DialogTitle>
        <DialogDescription className="text-sm leading-relaxed text-quiet">{current.body}</DialogDescription>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((s, i) => (
              <span
                key={s.title}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-spark" : "w-1.5 bg-line"}`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="rounded-full px-3 py-2 text-xs font-medium text-quiet hover:text-ink focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              Skip
            </button>
            <button
              onClick={() => (last ? close() : setStep(step + 1))}
              className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {last ? "Start building" : "Next"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
