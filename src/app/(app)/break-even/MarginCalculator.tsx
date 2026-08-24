"use client";

import { useMemo, useState } from "react";
import { priceForMargin } from "@/lib/calculations";
import { formatCurrency, formatPercent } from "@/lib/format";
import { QUOTE_MARGIN_PRESETS } from "@/lib/types";

export function MarginCalculator({ breakEvenRate, defaultMargin }: { breakEvenRate: number; defaultMargin: number }) {
  const [margin, setMargin] = useState(defaultMargin);

  const rate = useMemo(() => priceForMargin(breakEvenRate, margin), [breakEvenRate, margin]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {QUOTE_MARGIN_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setMargin(preset)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              margin === preset
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {preset}%
          </button>
        ))}
        <label className="ml-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Custom margin
          <input
            type="number"
            step="0.5"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value) || 0)}
            className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
          %
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/40">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Break-even rate</div>
          <div className="text-xl font-semibold">{formatCurrency(breakEvenRate, true)}/hr</div>
        </div>
        <div className="rounded-lg bg-slate-50 px-4 py-3 dark:bg-slate-800/40">
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Target margin</div>
          <div className="text-xl font-semibold">{formatPercent(margin)}</div>
        </div>
        <div className="rounded-lg bg-indigo-50 px-4 py-3 dark:bg-indigo-950/40">
          <div className="text-xs uppercase tracking-wide text-indigo-600 dark:text-indigo-400">Rate required</div>
          <div className="text-xl font-semibold text-indigo-700 dark:text-indigo-300">{formatCurrency(rate, true)}/hr</div>
        </div>
      </div>
    </div>
  );
}
