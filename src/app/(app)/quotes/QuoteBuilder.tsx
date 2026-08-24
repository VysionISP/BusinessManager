"use client";

// Fergus-style quote builder: a spreadsheet-like grid you type straight
// into. Price auto-fills from cost at the business target margin, markup
// and price stay in sync whichever one you edit, labour lines default to
// the break-even labour rate, and every change autosaves in the
// background. Totals update live as you type.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { QUOTE_LINE_TYPES, QUOTE_LINE_TYPE_LABELS, type QuoteLineType } from "@/lib/types";
import { DraggableSections } from "./DraggableSections";
import {
  createQuoteLineInline,
  deleteQuoteLine,
  deleteSection,
  saveQuoteLineInline,
  updateSectionInline,
  type QuoteLineInput,
} from "./actions";

interface LineState extends QuoteLineInput {
  id: number | null; // null while a freshly-typed row is being created
  key: string; // stable react key, survives id assignment
}

interface SectionState {
  id: number;
  name: string;
  description: string;
  displayMode: string;
  lines: LineState[];
}

export interface QuoteBuilderProps {
  quoteId: number;
  sections: {
    id: number;
    name: string;
    description: string | null;
    displayMode: string;
    lines: {
      id: number;
      lineType: string;
      description: string;
      quantity: number;
      unit: string;
      unitCost: number;
      unitPrice: number;
      taxPercent: number;
      discountPercent: number;
    }[];
  }[];
  /** Business break-even labour cost per billable hour — the default cost on labour lines. */
  breakEvenLabourRate: number;
  /** Business target profit margin % — used to suggest a price when a cost is entered. */
  targetMarginPercent: number;
  /** Active stock items — description cells autocomplete from this price list. */
  priceList: { name: string; unit: string; unitCost: number }[];
  reorderAction: (orderedIds: number[]) => void;
}

let keyCounter = 0;
const nextKey = () => `k${++keyCounter}`;

function emptyLine(): LineState {
  return {
    id: null,
    key: nextKey(),
    lineType: "MATERIAL",
    description: "",
    quantity: 1,
    unit: "item",
    unitCost: 0,
    unitPrice: 0,
    taxPercent: 0,
    discountPercent: 0,
  };
}

const priceFromMargin = (cost: number, marginPercent: number) =>
  marginPercent < 100 ? cost / (1 - marginPercent / 100) : cost;

const lineSell = (l: LineState) => l.quantity * l.unitPrice * (1 - l.discountPercent / 100);
const lineCost = (l: LineState) => l.quantity * l.unitCost;
const lineTax = (l: LineState) => lineSell(l) * (l.taxPercent / 100);
const lineMarkup = (l: LineState) => (l.unitCost > 0 ? ((l.unitPrice - l.unitCost) / l.unitCost) * 100 : 0);

const isRealRow = (l: LineState) =>
  l.description.trim() !== "" || l.unitCost !== 0 || l.unitPrice !== 0 || l.id !== null;

export function QuoteBuilder({ quoteId, sections, breakEvenLabourRate, targetMarginPercent, priceList, reorderAction }: QuoteBuilderProps) {
  const [state, setState] = useState<SectionState[]>(() =>
    sections.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? "",
      displayMode: s.displayMode,
      lines: [...s.lines.map((l) => ({ ...l, key: nextKey() }) as LineState), emptyLine()],
    })),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const pendingSaves = useRef(0);
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Rows being created on the server: key → promise resolving to the new id.
  const creating = useRef(new Map<string, Promise<number>>());

  // The section set is server-truth: if sections are added/removed elsewhere
  // (modal, delete), resync structure while keeping edits to surviving rows.
  const sectionKey = sections.map((s) => s.id).join(",");
  const [syncedKey, setSyncedKey] = useState(sectionKey);
  if (sectionKey !== syncedKey) {
    setSyncedKey(sectionKey);
    setState((prev) => {
      const prevById = new Map(prev.map((s) => [s.id, s]));
      return sections.map(
        (s) =>
          prevById.get(s.id) ?? {
            id: s.id,
            name: s.name,
            description: s.description ?? "",
            displayMode: s.displayMode,
            lines: [...s.lines.map((l) => ({ ...l, key: nextKey() }) as LineState), emptyLine()],
          },
      );
    });
  }

  const trackSave = useCallback(async <T,>(work: Promise<T>): Promise<T | undefined> => {
    pendingSaves.current += 1;
    setSaveState("saving");
    try {
      const result = await work;
      return result;
    } catch {
      setSaveState("error");
      return undefined;
    } finally {
      pendingSaves.current -= 1;
      if (pendingSaves.current === 0) setSaveState((s) => (s === "error" ? "error" : "saved"));
    }
  }, []);

  const persistLine = useCallback(
    (sectionId: number, line: LineState) => {
      const { id, key, ...data } = line;
      if (id !== null) {
        void trackSave(saveQuoteLineInline(quoteId, id, data));
        return;
      }
      // Row not on the server yet. Create once; queue subsequent edits
      // behind the create so they update the right id.
      const inFlight = creating.current.get(key);
      if (inFlight) {
        void trackSave(inFlight.then((newId) => saveQuoteLineInline(quoteId, newId, data)));
        return;
      }
      const createPromise = createQuoteLineInline(quoteId, sectionId, data).then(({ id: newId }) => {
        setState((prev) =>
          prev.map((s) =>
            s.id === sectionId ? { ...s, lines: s.lines.map((l) => (l.key === key ? { ...l, id: newId } : l)) } : s,
          ),
        );
        creating.current.delete(key);
        return newId;
      });
      creating.current.set(key, createPromise);
      void trackSave(createPromise);
    },
    [quoteId, trackSave],
  );

  const scheduleSave = useCallback(
    (sectionId: number, line: LineState) => {
      const existing = saveTimers.current.get(line.key);
      if (existing) clearTimeout(existing);
      saveTimers.current.set(
        line.key,
        setTimeout(() => {
          saveTimers.current.delete(line.key);
          persistLine(sectionId, line);
        }, 600),
      );
    },
    [persistLine],
  );

  useEffect(() => {
    const timers = saveTimers.current;
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  function updateLine(sectionId: number, key: string, patch: Partial<LineState>) {
    setState((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        let lines = s.lines.map((l) => (l.key === key ? { ...l, ...patch } : l));
        // Keep exactly one blank row at the bottom of every section.
        if (lines.every(isRealRow)) lines = [...lines, emptyLine()];
        const updated = lines.find((l) => l.key === key);
        if (updated && isRealRow(updated)) scheduleSave(sectionId, updated);
        return { ...s, lines };
      }),
    );
  }

  function removeLine(sectionId: number, line: LineState) {
    const timer = saveTimers.current.get(line.key);
    if (timer) clearTimeout(timer);
    setState((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, lines: s.lines.filter((l) => l.key !== line.key) } : s)),
    );
    if (line.id !== null) void trackSave(deleteQuoteLine(quoteId, line.id));
  }

  function updateSectionMeta(sectionId: number, patch: Partial<Pick<SectionState, "name" | "description" | "displayMode">>) {
    setState((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));
  }

  function saveSectionMeta(section: SectionState) {
    void trackSave(
      updateSectionInline(quoteId, section.id, {
        name: section.name,
        description: section.description,
        displayMode: section.displayMode,
      }),
    );
  }

  const allLines = useMemo(() => state.flatMap((s) => s.lines.filter(isRealRow)), [state]);
  const totals = useMemo(() => {
    const totalCost = allLines.reduce((sum, l) => sum + lineCost(l), 0);
    const totalSell = allLines.reduce((sum, l) => sum + lineSell(l), 0);
    const totalTax = allLines.reduce((sum, l) => sum + lineTax(l), 0);
    const profit = totalSell - totalCost;
    return {
      totalCost,
      totalSell,
      totalTax,
      totalWithTax: totalSell + totalTax,
      profit,
      marginPercent: totalSell > 0 ? (profit / totalSell) * 100 : 0,
    };
  }, [allLines]);

  const cellClass =
    "w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm hover:border-slate-200 focus:border-indigo-400 focus:bg-white focus:outline-none dark:hover:border-slate-700 dark:focus:bg-slate-900";
  const numClass = `${cellClass} text-right tabular-nums`;

  return (
    <div className="space-y-4">
      {priceList.length > 0 && (
        <datalist id="quote-price-list">
          {priceList.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>
      )}
      <DraggableSections sectionIds={state.map((s) => s.id)} reorderAction={reorderAction}>
        {state.map((section) => {
          const realLines = section.lines.filter(isRealRow);
          const sectionSell = realLines.reduce((sum, l) => sum + lineSell(l), 0);
          return (
            <div key={section.id} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <input
                  value={section.name}
                  onChange={(e) => updateSectionMeta(section.id, { name: e.target.value })}
                  onBlur={() => saveSectionMeta(section)}
                  className="min-w-40 flex-1 rounded border border-transparent bg-transparent px-1.5 py-1 font-semibold text-slate-800 hover:border-slate-200 focus:border-indigo-400 focus:outline-none dark:text-slate-100 dark:hover:border-slate-700"
                  aria-label="Section name"
                />
                <select
                  value={section.displayMode}
                  onChange={(e) => {
                    updateSectionMeta(section.id, { displayMode: e.target.value });
                    saveSectionMeta({ ...section, displayMode: e.target.value });
                  }}
                  className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  title="How this section appears on the customer's quote"
                >
                  <option value="ITEMIZED">Itemized on quote</option>
                  <option value="FIXED">One lump sum on quote</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (realLines.length === 0 || window.confirm(`Delete section "${section.name}" and its ${realLines.length} line(s)?`)) {
                      void trackSave(deleteSection(quoteId, section.id));
                    }
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                  aria-label={`Delete section ${section.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wide text-slate-400 dark:border-slate-800">
                      <th className="w-28 px-2 py-1.5 font-medium">Type</th>
                      <th className="px-2 py-1.5 font-medium">Description</th>
                      <th className="w-16 px-2 py-1.5 text-right font-medium">Qty</th>
                      <th className="w-16 px-2 py-1.5 font-medium">Unit</th>
                      <th className="w-24 px-2 py-1.5 text-right font-medium">Cost</th>
                      <th className="w-20 px-2 py-1.5 text-right font-medium">Mk-up %</th>
                      <th className="w-24 px-2 py-1.5 text-right font-medium">Price</th>
                      <th className="w-16 px-2 py-1.5 text-right font-medium">Tax %</th>
                      <th className="w-24 px-2 py-1.5 text-right font-medium">Total</th>
                      <th className="w-9 px-1 py-1.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {section.lines.map((line) => {
                      const blank = !isRealRow(line);
                      return (
                        <tr key={line.key} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                          <td className="px-1 py-0.5">
                            <select
                              value={line.lineType}
                              onChange={(e) => {
                                const lineType = e.target.value as QuoteLineType;
                                const patch: Partial<LineState> = { lineType };
                                // A fresh labour line starts at the break-even
                                // rate per hour, priced at the target margin.
                                if (lineType === "LABOUR" && line.unitCost === 0 && line.unitPrice === 0) {
                                  patch.unit = "hr";
                                  patch.unitCost = Number(breakEvenLabourRate.toFixed(2));
                                  patch.unitPrice = Number(priceFromMargin(breakEvenLabourRate, targetMarginPercent).toFixed(2));
                                }
                                updateLine(section.id, line.key, patch);
                              }}
                              className={`${cellClass} cursor-pointer`}
                              aria-label="Line type"
                            >
                              {QUOTE_LINE_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {QUOTE_LINE_TYPE_LABELS[t]}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              value={line.description}
                              placeholder={blank ? "Type to add a line…" : ""}
                              list="quote-price-list"
                              onChange={(e) => {
                                const description = e.target.value;
                                const patch: Partial<LineState> = { description };
                                // Picking a stock item from the price list
                                // fills its cost/unit and prices at margin.
                                const item = priceList.find((p) => p.name === description);
                                if (item && line.unitCost === 0) {
                                  patch.unitCost = item.unitCost;
                                  patch.unit = item.unit || line.unit;
                                  if (line.unitPrice === 0 && item.unitCost > 0) {
                                    patch.unitPrice = Number(priceFromMargin(item.unitCost, targetMarginPercent).toFixed(2));
                                  }
                                }
                                updateLine(section.id, line.key, patch);
                              }}
                              className={cellClass}
                              aria-label="Description"
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(section.id, line.key, { quantity: Number(e.target.value) || 0 })}
                              className={numClass}
                              aria-label="Quantity"
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              value={line.unit}
                              onChange={(e) => updateLine(section.id, line.key, { unit: e.target.value })}
                              className={cellClass}
                              aria-label="Unit of measure"
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={line.unitCost}
                              onChange={(e) => {
                                const unitCost = Number(e.target.value) || 0;
                                const patch: Partial<LineState> = { unitCost };
                                // Entering a cost on an unpriced line suggests
                                // the price at the business target margin.
                                if (line.unitPrice === 0 && unitCost > 0) {
                                  patch.unitPrice = Number(priceFromMargin(unitCost, targetMarginPercent).toFixed(2));
                                }
                                updateLine(section.id, line.key, patch);
                              }}
                              className={numClass}
                              aria-label="Unit cost"
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              step="0.1"
                              value={Number(lineMarkup(line).toFixed(1))}
                              onChange={(e) => {
                                const mk = Number(e.target.value) || 0;
                                updateLine(section.id, line.key, { unitPrice: Number((line.unitCost * (1 + mk / 100)).toFixed(2)) });
                              }}
                              className={numClass}
                              aria-label="Markup percent"
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(section.id, line.key, { unitPrice: Number(e.target.value) || 0 })}
                              className={numClass}
                              aria-label="Unit price"
                            />
                          </td>
                          <td className="px-1 py-0.5">
                            <input
                              type="number"
                              step="0.1"
                              value={line.taxPercent}
                              onChange={(e) => updateLine(section.id, line.key, { taxPercent: Number(e.target.value) || 0 })}
                              className={numClass}
                              aria-label="Tax percent"
                            />
                          </td>
                          <td className="px-2 py-0.5 text-right font-medium tabular-nums">
                            {blank ? "" : formatCurrency(lineSell(line))}
                          </td>
                          <td className="px-1 py-0.5 text-center">
                            {!blank && (
                              <button
                                type="button"
                                onClick={() => removeLine(section.id, line)}
                                className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-600 dark:hover:bg-rose-500/10"
                                aria-label="Delete line"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {realLines.length > 0 && (
                    <tfoot>
                      <tr>
                        <td colSpan={8} className="px-2 py-1.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Section subtotal
                        </td>
                        <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{formatCurrency(sectionSell)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          );
        })}
      </DraggableSections>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-3 gap-x-8 gap-y-1 sm:grid-cols-6">
          <TotalStat label="Cost" value={formatCurrency(totals.totalCost)} />
          <TotalStat label="Subtotal" value={formatCurrency(totals.totalSell)} />
          <TotalStat label="Tax" value={formatCurrency(totals.totalTax)} />
          <TotalStat label="Total" value={formatCurrency(totals.totalWithTax)} bold />
          <TotalStat label="Profit" value={formatCurrency(totals.profit)} />
          <TotalStat label="Margin" value={formatPercent(totals.marginPercent, 1)} warn={totals.marginPercent < targetMarginPercent} />
        </div>
        <span className="text-xs text-slate-400" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "All changes saved"}
          {saveState === "error" && <span className="font-medium text-rose-500">Some changes failed to save — check your connection and retry</span>}
        </span>
      </div>
    </div>
  );
}

function TotalStat({ label, value, bold, warn }: { label: string; value: string; bold?: boolean; warn?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`${bold ? "text-base font-bold" : "text-sm font-semibold"} tabular-nums ${warn ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {value}
      </div>
    </div>
  );
}
