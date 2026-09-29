import { useRef, useState } from "react";
import { FileUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseHistory, type ImportedCampaign } from "@/lib/import-history";
import type { Brand, Memory } from "@/lib/types";

const average = (rows: { actualCtr: number }[]) => rows.length ? (rows.reduce((sum, row) => sum + row.actualCtr, 0) / rows.length).toFixed(1) : "—";

export function ImportHistory({ brand, existing, onImport }: {
  brand: Brand;
  existing: Memory[];
  onImport: (rows: ImportedCampaign[]) => void;
}) {
  const [preview, setPreview] = useState<{ brandId: string; rows: ImportedCampaign[]; filename: string } | null>(null);
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selected = preview?.brandId === brand.id ? preview : null;
  const own = existing.filter((row) => row.source === "own");
  const incoming = selected?.rows.filter((row) => row.source === "own") ?? [];
  const combined = [...own, ...incoming];
  const baseline = own.length ? Number(average(own)) : null;
  const importedAverage = incoming.length ? Number(average(incoming)) : null;
  const bestChannel = incoming.length ? [...new Set(incoming.map((row) => row.channel))].map((channel) => ({ channel, rows: incoming.filter((row) => row.channel === channel) })).sort((a, b) => Number(average(b.rows)) - Number(average(a.rows)))[0] : null;

  async function selectFile(file?: File) {
    if (!file) return;
    setError(""); setPreview(null);
    if (!/\.(csv|json)$/i.test(file.name)) { setError("Choose a .csv or .json file."); return; }
    if (file.size > 1024 * 1024) { setError("Choose a file under 1 MB."); return; }
    setReading(true);
    try {
      const rows = parseHistory(await file.text(), file.name, brand.id, brand.name);
      setPreview({ brandId: brand.id, rows, filename: file.name });
    } catch (e) { setError(e instanceof Error ? e.message : "This file could not be read."); }
    finally { setReading(false); if (input.current) input.current.value = ""; }
  }

  return (
    <section id="import-history" className="mt-6 border-t border-line pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Import campaign history</h2>
          <p className="mt-1 text-sm text-quiet">Add past campaigns to {brand.name}. Preview how they compare before saving.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => input.current?.click()} disabled={reading}>
          <FileUp aria-hidden /> {reading ? "Reading…" : "Choose CSV or JSON"}
        </Button>
        <input ref={input} type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" aria-label="Campaign history file" onChange={(event) => void selectFile(event.target.files?.[0])} />
      </div>
      <p className="mt-2 text-xs text-quiet">Columns: hook, channel, actualCtr (or clicks + impressions). Optional: brand, body, audience, festival, goal, year, source, competitor, predictedCtr. Data stays in this browser.</p>
      {error && <p role="alert" className="mt-3 text-sm text-flop">{error}</p>}
      {selected && (
        <div className="mt-5 border-t border-line pt-4" aria-live="polite">
          <div className="flex items-start justify-between gap-3">
            <div><h3 className="font-display font-bold">Preview · {selected.filename}</h3><p className="text-xs text-quiet">{selected.rows.length} campaigns · {incoming.length} own · {selected.rows.length - incoming.length} rival</p></div>
            <Button variant="ghost" size="icon" aria-label="Dismiss import preview" title="Dismiss preview" onClick={() => setPreview(null)}><X aria-hidden /></Button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm sm:max-w-lg">
            <div className="border-r border-line px-1"><p className="text-xs text-quiet">Current average CTR</p><strong className="font-display text-lg">{average(own)}{own.length ? "%" : ""}</strong></div>
            <div className="border-r border-line px-1"><p className="text-xs text-quiet">Imported average CTR</p><strong className="font-display text-lg">{average(incoming)}{incoming.length ? "%" : ""}</strong></div>
            <div className="px-1"><p className="text-xs text-quiet">Combined average CTR</p><strong className="font-display text-lg text-win">{average(combined)}%</strong></div>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-quiet">
            <li>{selected.rows.filter((row) => row.outcome === "win").length} wins and {selected.rows.filter((row) => row.outcome === "flop").length} flops in the file.</li>
            {bestChannel && <li>{bestChannel.channel} leads the imported campaigns at {average(bestChannel.rows)}% average CTR ({bestChannel.rows.length} {bestChannel.rows.length === 1 ? "campaign" : "campaigns"}).</li>}
            {baseline !== null && importedAverage !== null && <li>Imported own campaigns average {Math.abs(importedAverage - baseline).toFixed(1)} points {importedAverage >= baseline ? "above" : "below"} the existing bank.</li>}
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={() => { onImport(selected.rows); setPreview(null); }} disabled={existing.length + selected.rows.length > 200}>Add {selected.rows.length} to {brand.name}</Button>
            {existing.length + selected.rows.length > 200 && <span className="text-xs text-flop">The memory bank holds 200 campaigns. Choose a smaller file.</span>}
          </div>
        </div>
      )}
    </section>
  );
}
