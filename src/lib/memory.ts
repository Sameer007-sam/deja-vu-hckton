import type { Brief, Draft, Memory, RecalledMemory } from "./types";

/** The memory layer is isolated behind three functions: retain, recall, reflect. */

const STOP = new Set(["the", "and", "for", "with", "our", "your", "who", "are"]);

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );
}

function overlap(a: string, b: string): number {
  const A = tokens(a);
  const B = tokens(b);
  if (A.size === 0 || B.size === 0) return 0;
  let hits = 0;
  A.forEach((t) => {
    if (B.has(t)) hits += 1;
  });
  return hits / Math.max(A.size, B.size);
}

export function similarity(brief: Brief, memory: Memory): number {
  let score = 0;
  if (memory.festival === brief.festival && brief.festival !== "No festival") score += 0.35;
  if (memory.channel === brief.channel) score += 0.2;
  score += 0.25 * overlap(brief.audience, memory.audience);
  score += memory.goal === brief.goal ? 0.2 : 0.2 * overlap(brief.goal, memory.goal);
  return Math.min(1, score);
}

/** recall(): pull the most relevant memories from this brand's bank only. */
export function recall(memories: Memory[], brief: Brief, limit = 6): RecalledMemory[] {
  return memories
    .filter((m) => m.brandId === brief.brandId)
    .map((memory) => ({ memory, similarity: similarity(brief, memory) }))
    .filter((r) => r.similarity >= 0.15)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/** retain(): add a memory to the bank (handled by the store, kept here for the API shape). */
export function retain(memories: Memory[], memory: Memory, cap = 200): Memory[] {
  return [memory, ...memories].slice(0, cap);
}

export function dejaVuScore(recalled: RecalledMemory[]): number {
  if (recalled.length === 0) return 0;
  const top = recalled[0]!.similarity;
  const avg = recalled.slice(0, 3).reduce((s, r) => s + r.similarity, 0) / Math.min(3, recalled.length);
  return Math.round(100 * Math.min(1, 0.7 * top + 0.3 * avg));
}

export interface Plan {
  strategy: "exploit" | "explore";
  predictedCtr: number;
  baselineCtr: number;
  reasons: string[];
  winningHooks: RecalledMemory[];
  avoidHooks: RecalledMemory[];
  rivalHooks: RecalledMemory[];
}

export function plan(brief: Brief, recalled: RecalledMemory[]): Plan {
  const own = recalled.filter((r) => r.memory.source === "own");
  const rivals = recalled.filter((r) => r.memory.source === "competitor");
  const wins = own.filter((r) => r.memory.outcome === "win");
  const flops = own.filter((r) => r.memory.outcome === "flop");
  const rivalWins = rivals.filter((r) => r.memory.outcome === "win");

  const baselineCtr = 1.4;
  const reasons: string[] = [];

  if (recalled.length === 0) {
    reasons.push("Empty bank for this brief — first round is a pure exploration.");
    return {
      strategy: "explore",
      predictedCtr: 1.8,
      baselineCtr,
      reasons,
      winningHooks: [],
      avoidHooks: [],
      rivalHooks: [],
    };
  }

  const weightedWin =
    wins.length > 0
      ? wins.reduce((s, r) => s + r.memory.actualCtr * r.similarity, 0) /
        wins.reduce((s, r) => s + r.similarity, 0)
      : 0;

  const bestWin = wins[0];
  const winIsTired = Boolean(bestWin && bestWin.memory.actualCtr < 2.6);
  const strategy: Plan["strategy"] = wins.length === 0 || winIsTired ? "explore" : "exploit";

  let predicted = strategy === "exploit" ? weightedWin * 0.96 : Math.max(weightedWin, baselineCtr) * 1.15 + 0.6;

  if (flops.length > 0) {
    predicted -= 0.25 * flops[0]!.similarity;
    reasons.push(
      `Suppressed "${flops[0]!.memory.hook}" — it flopped at ${flops[0]!.memory.actualCtr.toFixed(1)}% CTR on a similar brief.`,
    );
  }
  if (rivalWins.length > 0) {
    predicted *= 0.9;
    reasons.push(
      `Discounted the hook ${rivalWins[0]!.memory.competitor} already wins with ("${rivalWins[0]!.memory.hook}").`,
    );
  }
  wins.slice(0, 2).forEach((r) => {
    reasons.push(
      `Recalled win "${r.memory.hook}" (${r.memory.festival}, ${r.memory.actualCtr.toFixed(1)}% CTR, ${Math.round(r.similarity * 100)}% match).`,
    );
  });
  if (strategy === "explore") {
    reasons.push("Past hooks underperformed, so the agent is testing an untested angle (explore).");
  } else {
    reasons.push("Strong past winner on this exact festival + channel, so the agent is exploiting it.");
  }

  return {
    strategy,
    predictedCtr: Math.max(0.6, Math.min(9.5, Number(predicted.toFixed(1)))),
    baselineCtr,
    reasons,
    winningHooks: wins,
    avoidHooks: flops,
    rivalHooks: rivalWins,
  };
}

/** reflect(): turn raw memories into plain-English insights. */
export function reflect(memories: Memory[], brandId: string): string[] {
  const bank = memories.filter((m) => m.brandId === brandId && m.source === "own");
  if (bank.length < 2) return ["Not enough memories yet. Run a couple of rounds and reflect again."];

  const insights: string[] = [];
  const byChannel = new Map<string, number[]>();
  const byFestival = new Map<string, number[]>();
  bank.forEach((m) => {
    byChannel.set(m.channel, [...(byChannel.get(m.channel) ?? []), m.actualCtr]);
    byFestival.set(m.festival, [...(byFestival.get(m.festival) ?? []), m.actualCtr]);
  });
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

  const channels = [...byChannel.entries()].sort((a, b) => avg(b[1]) - avg(a[1]));
  const bestChannel = channels.find(([, xs]) => xs.length > 1) ?? channels[0];
  if (bestChannel) {
    const n = bestChannel[1].length;
    insights.push(
      `${bestChannel[0]} is this brand's strongest channel so far — ${avg(bestChannel[1]).toFixed(1)}% average CTR across ${n} campaign${n === 1 ? "" : "s"}.`,
    );
  }

  const bestFestival = [...byFestival.entries()].sort((a, b) => avg(b[1]) - avg(a[1]))[0];
  if (bestFestival && bestFestival[0] !== "No festival") {
    insights.push(
      `${bestFestival[0]} campaigns outperform the rest (${avg(bestFestival[1]).toFixed(1)}% CTR). Plan next year's brief around it early.`,
    );
  }

  const flops = bank.filter((m) => m.outcome === "flop");
  if (flops.length > 0) {
    const discounty = flops.filter((m) => /%|off|sale|discount|deal/i.test(`${m.hook} ${m.body}`));
    insights.push(
      discounty.length >= Math.max(1, Math.floor(flops.length / 2))
        ? `Discount-led copy is the recurring failure pattern — ${discounty.length} of ${flops.length} flops led with a price cut.`
        : `${flops.length} flops are stored and now actively avoided when a similar brief arrives.`,
    );
  }

  const wins = bank.filter((m) => m.outcome === "win");
  if (wins.length > 0) {
    insights.push(
      `Ritual and community framing wins: the top ${Math.min(3, wins.length)} hooks all lean on a shared moment rather than a price.`,
    );
  }
  return insights;
}

export function withoutMemoryDraft(brief: Brief, brandName: string): Draft {
  const occasion = brief.festival === "No festival" ? "this season" : brief.festival;
  return {
    hook: `${brandName} — something for everyone this ${occasion}`,
    body: `Celebrate ${occasion} with ${brandName}. Great quality, great prices. Order online today!`,
    predictedCtr: 1.4,
  };
}

/** Offline template generator used when the AI service is slow or unavailable. */
export function localDraft(brief: Brief, brandName: string, p: Plan): Draft {
  const occasion = brief.festival === "No festival" ? "the week ahead" : brief.festival;
  const seedHook = p.winningHooks[0]?.memory.hook;
  const hook =
    p.strategy === "exploit" && seedHook
      ? seedHook.replace(/\.$/, "") + `, again this ${occasion}.`
      : `A new ${occasion} ritual, made for ${brief.audience.split(",")[0]!.trim()}.`;
  return {
    hook,
    body: `${hook} ${brandName} on ${brief.channel} — built from ${p.winningHooks.length} past wins and ${p.avoidHooks.length} remembered flops.`,
    predictedCtr: p.predictedCtr,
  };
}
