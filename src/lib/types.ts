export type Outcome = "win" | "flop" | "pending";

export const CHANNELS = [
  "Instagram Reels",
  "WhatsApp",
  "YouTube Shorts",
  "X (Twitter)",
  "Google Search",
  "Outdoor",
] as const;

export const FESTIVALS = [
  "Diwali",
  "Bonalu",
  "IPL",
  "Sankranti",
  "Ugadi",
  "Eid",
  "Holi",
  "Ganesh Chaturthi",
  "No festival",
] as const;

export const GOALS = [
  "First-order lift",
  "Footfall",
  "Awareness",
  "Repeat orders",
  "App installs",
] as const;

export type Channel = (typeof CHANNELS)[number];
export type Festival = (typeof FESTIVALS)[number];
export type Goal = (typeof GOALS)[number];

export interface Brand {
  id: string;
  name: string;
  category: string;
  tone: string;
  isDemo?: boolean;
}

export interface Memory {
  id: string;
  brandId: string;
  hook: string;
  body: string;
  audience: string;
  channel: string;
  festival: string;
  goal: string;
  predictedCtr: number | null;
  actualCtr: number;
  outcome: Outcome;
  source: "own" | "competitor";
  competitor?: string;
  year: number;
  createdAt: number;
}

export interface Brief {
  brandId: string;
  audience: string;
  channel: Channel | string;
  festival: Festival | string;
  goal: Goal | string;
}

export interface RecalledMemory {
  memory: Memory;
  similarity: number;
}

export interface Draft {
  hook: string;
  body: string;
  predictedCtr: number;
}

export interface GenerationResult {
  brief: Brief;
  withoutMemory: Draft;
  withMemory: Draft;
  dejaVuScore: number;
  strategy: "exploit" | "explore";
  recalled: RecalledMemory[];
  reasons: string[];
  offline: boolean;
  createdAt: number;
}
