import { ChevronDown, ChevronUp } from "lucide-react";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency } from "@/lib/format";
import { quoteTotals, type QuoteLineLike } from "@/lib/calculations";
import { QUOTE_SECTION_DISPLAY_MODE_LABELS, type QuoteSectionDisplayMode } from "@/lib/types";
import type { QuoteLine, QuoteSection } from "@prisma/client";
import { QuoteLineForm } from "./QuoteLineForm";
import { QuoteLineRow } from "./QuoteLineRow";
import { SectionForm } from "./SectionForm";
import { addQuoteLine, deleteQuoteLine, deleteSection, moveQuoteLine, moveSection, updateQuoteLine, updateSection } from "./actions";

export function SectionCard({
  quoteId,
  section,
  lines,
  canMoveUp,
  canMoveDown,
}: {
  quoteId: number;
  section: QuoteSection;
  lines: QuoteLine[];
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const sectionLines = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
  const totals = quoteTotals(sectionLines as QuoteLineLike[]);
  const boundAddLine = addQuoteLine.bind(null, quoteId, section.id);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <form action={moveSection.bind(null, quoteId, section.id, "up")}>
                <button
                  type="submit"
                  disabled={!canMoveUp}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                  aria-label="Move section up"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
              </form>
              <form action={moveSection.bind(null, quoteId, section.id, "down")}>
                <button
                  type="submit"
                  disabled={!canMoveDown}
                  className="rounded p-0.5 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
                  aria-label="Move section down"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
              </form>
            </div>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{section.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {QUOTE_SECTION_DISPLAY_MODE_LABELS[section.displayMode as QuoteSectionDisplayMode] ?? section.displayMode}
            </span>
          </div>
          {section.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{section.description}</p>}
        </div>
        <details>
          <summary className="cursor-pointer text-xs font-medium text-indigo-600">Edit section</summary>
          <div className="mt-3 w-72">
            <SectionForm section={section} action={updateSection.bind(null, quoteId, section.id)} />
            <form action={deleteSection.bind(null, quoteId, section.id)} className="mt-2">
              <button type="submit" className="text-xs text-rose-600 hover:underline">
                Delete section
              </button>
            </form>
          </div>
        </details>
      </div>

      <div className="p-4">
        <Table>
          <THead>
            <Th>Description</Th>
            <Th>Qty</Th>
            <Th>UoM</Th>
            <Th>Cost</Th>
            <Th>Price</Th>
            <Th>Markup</Th>
            <Th>Tax</Th>
            <Th>Total</Th>
            <Th />
          </THead>
          <tbody>
            {sectionLines.map((line, i) => (
              <QuoteLineRow
                key={line.id}
                line={line}
                canMoveUp={i > 0}
                canMoveDown={i < sectionLines.length - 1}
                updateAction={updateQuoteLine.bind(null, quoteId, line.id)}
                deleteAction={deleteQuoteLine.bind(null, quoteId, line.id)}
                moveAction={moveQuoteLine.bind(null, quoteId, section.id, line.id)}
              />
            ))}
            {sectionLines.length === 0 && <EmptyRow colSpan={9}>No line items in this section yet.</EmptyRow>}
          </tbody>
          {sectionLines.length > 0 && (
            <tfoot>
              <Tr className="hover:bg-transparent dark:hover:bg-transparent">
                <Td colSpan={7} className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Section subtotal
                </Td>
                <Td className="font-semibold">{formatCurrency(totals.totalSell)}</Td>
                <Td />
              </Tr>
            </tfoot>
          )}
        </Table>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Add a line item</summary>
          <div className="mt-3">
            <QuoteLineForm action={boundAddLine} />
          </div>
        </details>
      </div>
    </div>
  );
}
