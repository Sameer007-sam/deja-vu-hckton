import { ClientOnly } from "@tanstack/react-router";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Memory } from "@/lib/types";

export function LearningCurve({ memories }: { memories: Memory[] }) {
  const data = [...memories]
    .filter((m) => m.source === "own" && m.predictedCtr !== null)
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((m, i) => ({
      round: `R${i + 1}`,
      predicted: m.predictedCtr as number,
      actual: m.actualCtr,
    }));

  if (data.length < 2) {
    return <p className="mt-2 text-sm text-quiet">Record two results and the learning curve appears here.</p>;
  }

  return (
    <ClientOnly fallback={<div className="mt-2 h-40 rounded-xl bg-soft" aria-hidden />}>
      <div className="mt-2 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
            <CartesianGrid stroke="var(--color-line)" vertical={false} />
            <XAxis dataKey="round" tick={{ fontSize: 10, fill: "var(--color-quiet)" }} stroke="var(--color-line)" />
            <YAxis tick={{ fontSize: 10, fill: "var(--color-quiet)" }} stroke="var(--color-line)" unit="%" />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-line)",
                borderRadius: 12,
                fontSize: 12,
                color: "var(--color-ink)",
              }}
            />
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="var(--color-spark)"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              name="Predicted CTR"
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--color-win)"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              name="Actual CTR"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ClientOnly>
  );
}
