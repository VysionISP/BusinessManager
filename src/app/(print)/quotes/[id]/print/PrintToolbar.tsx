"use client";

import Link from "next/link";

export function PrintToolbar({ quoteId }: { quoteId: number }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 print:hidden">
      <Link href={`/quotes/${quoteId}`} className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to quote
      </Link>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Print / Save as PDF
      </button>
    </div>
  );
}
