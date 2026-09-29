import type { Memory } from "./types";
import { seedMemories } from "./seed";

const KEY_SESSION = "dejavu.session";
const MEMORY_CAP = 200;

/** Anonymous per-visitor session id, so concurrent users never share a memory bank. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = window.localStorage.getItem(KEY_SESSION);
  if (!id) {
    id = `s_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
    window.localStorage.setItem(KEY_SESSION, id);
  }
  return id;
}

function bankKey(): string {
  return `dejavu.bank.${getSessionId()}`;
}

export function loadMemories(): Memory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(bankKey());
    if (!raw) {
      const seeded = seedMemories();
      saveMemories(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as Memory[];
    return Array.isArray(parsed) ? parsed : seedMemories();
  } catch {
    return seedMemories();
  }
}

export function saveMemories(memories: Memory[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(bankKey(), JSON.stringify(memories.slice(0, MEMORY_CAP)));
  } catch {
    /* quota exceeded — the in-memory bank still works for this session */
  }
}

export function resetDemo(): Memory[] {
  const seeded = seedMemories();
  saveMemories(seeded);
  return seeded;
}

const KEY_TOUR = "dejavu.tour.done";

export function tourSeen(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(KEY_TOUR) === "1";
}

export function markTourSeen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY_TOUR, "1");
}
