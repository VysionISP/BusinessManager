"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { quoteAtMargins, quoteDirectCost } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { QUOTE_MARGIN_PRESETS } from "@/lib/types";
import { createJobFromQuote } from "./actions";

const numberInput =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800";

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <input
        type="number"
        step="0.01"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className={numberInput}
      />
      {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function QuoteCalculator({ breakEvenLabourRate }: { breakEvenLabourRate: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customerName, setCustomerName] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [subcontractorCost, setSubcontractorCost] = useState(0);
  const [equipmentHire, setEquipmentHire] = useState(0);
  const [travel, setTravel] = useState(0);
  const [accommodation, setAccommodation] = useState(0);
  const [otherDirectExpenses, setOtherDirectExpenses] = useState(0);
  const [customMargin, setCustomMargin] = useState(35);
  const [selectedMargin, setSelectedMargin] = useState<number>(20);

  const breakdown = useMemo(
    () =>
      quoteDirectCost(
        { estimatedHours, materialCost, subcontractorCost, equipmentHire, travel, accommodation, otherDirectExpenses },
        breakEvenLabourRate,
      ),
    [estimatedHours, materialCost, subcontractorCost, equipmentHire, travel, accommodation, otherDirectExpenses, breakEvenLabourRate],
  );

  const margins = useMemo(() => {
    const presets = [...QUOTE_MARGIN_PRESETS];
    const list = presets.includes(customMargin as (typeof QUOTE_MARGIN_PRESETS)[number]) ? presets : [...presets, customMargin].sort((a, b) => a - b);
    return quoteAtMargins(breakdown.directJobCost, list);
  }, [breakdown.directJobCost, customMargin]);

  const selectedQuote = margins.find((m) => m.marginPercent === selectedMargin) ?? margins[0];

  function handleCreateJob() {
    startTransition(async () => {
      const id = await createJobFromQuote({
        customerName,
        description,
        quoteAmount: selectedQuote?.price ?? 0,
        estimatedHours,
        labourCost: breakdown.labourCost,
        materialCost,
        subcontractorCost,
        otherDirectCosts: equipmentHire + travel + accommodation + otherDirectExpenses,
      });
      router.push(`/jobs/${id}`);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-1">
        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Customer</span>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={numberInput} type="text" />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Job description</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className={numberInput} type="text" />
        </label>
        <Field label="Estimated labour hours" value={estimatedHours} onChange={setEstimatedHours} />
        <Field label="Estimated material cost ($)" value={materialCost} onChange={setMaterialCost} />
        <Field label="Estimated subcontractor cost ($)" value={subcontractorCost} onChange={setSubcontractorCost} />
        <Field label="Equipment hire ($)" value={equipmentHire} onChange={setEquipmentHire} />
        <Field label="Travel ($)" value={travel} onChange={setTravel} />
        <Field label="Accommodation ($)" value={accommodation} onChange={setAccommodation} />
        <Field label="Other direct expenses ($)" value={otherDirectExpenses} onChange={setOtherDirectExpenses} />
      </div>

      <div className="space-y-5 lg:col-span-2">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Labour cost ({estimatedHours}hrs × {formatCurrency(breakEvenLabourRate, true)})
              </div>
              <div className="text-lg font-semibold">{formatCurrency(breakdown.labourCost)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Direct job cost</div>
              <div className="text-lg font-semibold">{formatCurrency(breakdown.directJobCost)}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Quote at margin</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Margin</th>
                  <th className="py-2 pr-4">Quote price</th>
                  <th className="py-2 pr-4">Profit</th>
                  <th className="py-2 pr-4">Equivalent markup</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {margins.map((m) => (
                  <tr
                    key={m.marginPercent}
                    className={`cursor-pointer border-b border-slate-50 last:border-0 dark:border-slate-800/60 ${
                      m.marginPercent === selectedMargin ? "bg-blue-50 dark:bg-blue-950/30" : ""
                    }`}
                    onClick={() => setSelectedMargin(m.marginPercent)}
                  >
                    <td className="py-2 pr-4 font-medium">{formatPercent(m.marginPercent)}</td>
                    <td className="py-2 pr-4">{formatCurrency(m.price)}</td>
                    <td className="py-2 pr-4">{formatCurrency(m.profit)}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{formatPercent(m.markupPercent, 1)} markup</td>
                    <td className="py-2 pr-4">
                      <input type="radio" checked={m.marginPercent === selectedMargin} readOnly />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            Custom margin
            <input
              type="number"
              step="0.5"
              value={customMargin}
              onChange={(e) => {
                const v = Number(e.target.value) || 0;
                setCustomMargin(v);
                setSelectedMargin(v);
              }}
              className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
            %
          </label>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Selected quote — {formatPercent(selectedMargin)} margin
              </div>
              <div className="text-2xl font-semibold text-blue-800 dark:text-blue-200">{formatCurrency(selectedQuote?.price ?? 0)}</div>
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={handleCreateJob}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isPending ? "Creating…" : "Create job from this quote"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
