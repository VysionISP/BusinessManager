import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { variationAllowanceTotal, variationProfit, variationSellPrice } from "@/lib/calculations";
import { VARIATION_STATUS_LABELS } from "@/lib/types";
import { VariationForm } from "./VariationForm";
import { addVariation, deleteVariation, setVariationStatus } from "../actions";
import type { Variation } from "@prisma/client";

const STATUS_SEVERITY: Record<string, "green" | "orange" | "red"> = {
  PENDING: "orange",
  APPROVED: "green",
  DECLINED: "red",
};

export function VariationList({ jobId, variations }: { jobId: number; variations: Variation[] }) {
  const approvedTotal = variations.filter((v) => v.status === "APPROVED").reduce((sum, v) => sum + variationSellPrice(v), 0);

  return (
    <div>
      <div className="mb-4">
        <VariationForm action={addVariation.bind(null, jobId)} />
      </div>

      <div className="space-y-3">
        {variations.map((v) => (
          <div key={v.id} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">
                  {v.variationNumber} — {v.title}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{v.scope}</div>
                <div className="mt-1 text-xs text-slate-400">
                  {v.requestedBy && `Requested by ${v.requestedBy}`}
                  {v.requestDate && ` on ${formatDate(v.requestDate)}`}
                  {v.reason && ` · ${v.reason}`}
                </div>
              </div>
              <TrafficBadge severity={STATUS_SEVERITY[v.status] ?? "orange"} label={VARIATION_STATUS_LABELS[v.status as keyof typeof VARIATION_STATUS_LABELS] ?? v.status} />
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 text-xs sm:grid-cols-4">
              <Stat label="Cost allowance" value={formatCurrency(variationAllowanceTotal(v))} />
              <Stat label="Sell price" value={formatCurrency(variationSellPrice(v))} />
              <Stat label="Profit" value={formatCurrency(variationProfit(v))} />
              <Stat label="Markup" value={`${v.markupPercent}%`} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <form action={setVariationStatus.bind(null, jobId, v.id)} className="flex items-center gap-2">
                <select name="status" defaultValue={v.status} className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="DECLINED">Declined</option>
                </select>
                <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  Update
                </button>
              </form>
              <form action={deleteVariation.bind(null, jobId, v.id)}>
                <button type="submit" className="text-xs text-rose-600 hover:underline">
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {variations.length === 0 && <p className="text-sm text-slate-400">No variations recorded yet.</p>}
      </div>

      {approvedTotal !== 0 && (
        <p className="mt-4 text-xs text-slate-400">
          Approved variations add <span className="font-medium text-slate-600 dark:text-slate-300">{formatCurrency(approvedTotal)}</span> to the
          contract value — the original quote is never changed.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-slate-400">{label}</div>
      <div className="font-medium text-slate-800 dark:text-slate-200">{value}</div>
    </div>
  );
}
