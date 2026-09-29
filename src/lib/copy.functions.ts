import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  brandName: z.string().min(1).max(80),
  brandTone: z.string().max(120).default(""),
  audience: z.string().min(1).max(160),
  channel: z.string().min(1).max(60),
  festival: z.string().min(1).max(60),
  goal: z.string().min(1).max(60),
  strategy: z.enum(["exploit", "explore"]),
  winningHooks: z.array(z.string().max(200)).max(5).default([]),
  avoidHooks: z.array(z.string().max(200)).max(5).default([]),
  rivalHooks: z.array(z.string().max(200)).max(5).default([]),
});

export interface CopyResult {
  ok: boolean;
  hook: string;
  body: string;
  error?: string;
}

function extractText(payload: unknown): string {
  const data = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
    choices?: Array<{ message?: { content?: string } }>;
  };
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text;
  const fromOutput = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((c) => c.text ?? "")
    .join("")
    .trim();
  if (fromOutput) return fromOutput;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Generates ad copy from recalled memories. Callers fall back to a local template on failure. */
export const generateCopy = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<CopyResult> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false, hook: "", body: "", error: "AI service is not configured." };

    const prompt = [
      `You are a marketing copywriter for ${data.brandName} (${data.brandTone}).`,
      `Brief: audience "${data.audience}", channel ${data.channel}, occasion ${data.festival}, goal ${data.goal}.`,
      data.winningHooks.length
        ? `These past hooks WON, reuse their angle: ${data.winningHooks.map((h) => `"${h}"`).join("; ")}.`
        : "No past winners for this brief.",
      data.avoidHooks.length
        ? `These FLOPPED, never repeat their angle: ${data.avoidHooks.map((h) => `"${h}"`).join("; ")}.`
        : "",
      data.rivalHooks.length
        ? `Competitors already own these angles, do not copy them: ${data.rivalHooks.map((h) => `"${h}"`).join("; ")}.`
        : "",
      data.strategy === "explore"
        ? "Past hooks underperformed, so invent a genuinely new angle."
        : "Lean into the proven winning angle with fresh wording.",
      'Reply with strict JSON only: {"hook": "under 12 words", "body": "one sentence under 30 words"}. No markdown.',
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "openai/gpt-6-astra", input: prompt }),
      });

      if (!res.ok) {
        const detail = await res.text();
        const message =
          res.status === 402
            ? "AI credits are exhausted for this workspace."
            : res.status === 429
              ? "AI service is rate limited right now."
              : `AI service returned ${res.status}.`;
        console.error("generateCopy failed", res.status, detail.slice(0, 500));
        return { ok: false, hook: "", body: "", error: message };
      }

      const text = extractText(await res.json());
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) return { ok: false, hook: "", body: "", error: "AI service returned an unreadable answer." };
      const parsed = JSON.parse(match[0]) as { hook?: string; body?: string };
      if (!parsed.hook || !parsed.body) {
        return { ok: false, hook: "", body: "", error: "AI service returned incomplete copy." };
      }
      return { ok: true, hook: String(parsed.hook).slice(0, 160), body: String(parsed.body).slice(0, 320) };
    } catch (error) {
      console.error("generateCopy error", error);
      return { ok: false, hook: "", body: "", error: "Could not reach the AI service." };
    }
  });
