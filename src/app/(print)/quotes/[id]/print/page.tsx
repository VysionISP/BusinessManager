import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/queries";
import { quoteLineSell, quoteTotals, type QuoteLineLike } from "@/lib/calculations";
import { formatCurrency, formatDate } from "@/lib/format";
import { PrintToolbar } from "./PrintToolbar";

export const dynamic = "force-dynamic";

// Customer-facing quote document — deliberately outside the app shell so it
// prints as a clean A4 page. Sections marked FIXED show a single lump sum;
// ITEMIZED sections show every line (description/qty/price only — internal
// costs and markup never appear on the customer copy).
export default async function QuotePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quoteId = Number(id);
  const [quote, settings] = await Promise.all([
    prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        customer: true,
        site: true,
        sections: { orderBy: { sortOrder: "asc" } },
        lines: { orderBy: { sortOrder: "asc" } },
      },
    }),
    getSettings(),
  ]);
  if (!quote) notFound();

  const totals = quoteTotals(quote.lines as QuoteLineLike[]);

  return (
    <div className="mx-auto max-w-3xl bg-white px-8 py-8 text-slate-900 print:max-w-none print:px-0 print:py-0">
      <PrintToolbar quoteId={quoteId} />

      <header className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
        <div>
          <h1 className="text-2xl font-bold">{settings.businessName}</h1>
          <p className="mt-1 text-sm text-slate-500">Quotation</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-lg font-bold">
            {quote.quoteNumber}
            {quote.version > 1 ? ` (rev ${quote.version})` : ""}
          </div>
          {quote.issueDate && <div>Issued {formatDate(quote.issueDate)}</div>}
          {quote.expiryDate && <div>Valid until {formatDate(quote.expiryDate)}</div>}
        </div>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-8 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Prepared for</div>
          <div className="mt-1 font-semibold">{quote.customer?.name ?? "(template — no customer)"}</div>
          {quote.customer?.billingAddress && <div className="whitespace-pre-line text-slate-600">{quote.customer.billingAddress}</div>}
          {quote.customer?.mainContactName && <div className="text-slate-600">Attn: {quote.customer.mainContactName}</div>}
        </div>
        <div>
          {quote.site && (
            <>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Site</div>
              <div className="mt-1 font-semibold">{quote.site.name}</div>
              <div className="whitespace-pre-line text-slate-600">{quote.site.address}</div>
            </>
          )}
          {quote.customerReference && (
            <div className="mt-2 text-slate-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your reference: </span>
              {quote.customerReference}
            </div>
          )}
        </div>
      </section>

      <h2 className="mt-6 text-lg font-bold">{quote.title}</h2>
      {quote.introduction && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{quote.introduction}</p>}
      {quote.scopeOfWork && (
        <section className="mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wide">Scope of work</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{quote.scopeOfWork}</p>
        </section>
      )}

      <section className="mt-6">
        {quote.sections.map((section) => {
          const sectionLines = quote.lines.filter((l) => l.sectionId === section.id);
          if (sectionLines.length === 0) return null;
          const sectionSell = sectionLines.reduce((sum, l) => sum + quoteLineSell(l as QuoteLineLike), 0);
          return (
            <div key={section.id} className="mb-5 break-inside-avoid">
              <div className="flex items-baseline justify-between border-b border-slate-300 pb-1">
                <h3 className="font-semibold">{section.name}</h3>
                {section.displayMode === "FIXED" && <span className="font-semibold tabular-nums">{formatCurrency(sectionSell)}</span>}
              </div>
              {section.description && <p className="mt-1 text-sm text-slate-600">{section.description}</p>}
              {section.displayMode !== "FIXED" && (
                <table className="mt-2 w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="py-1 font-medium">Description</th>
                      <th className="w-16 py-1 text-right font-medium">Qty</th>
                      <th className="w-24 py-1 text-right font-medium">Unit price</th>
                      <th className="w-24 py-1 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionLines.map((l) => (
                      <tr key={l.id} className="border-t border-slate-100">
                        <td className="py-1.5 pr-2">{l.description}</td>
                        <td className="py-1.5 text-right tabular-nums">
                          {l.quantity} {l.unit !== "item" ? l.unit : ""}
                        </td>
                        <td className="py-1.5 text-right tabular-nums">{formatCurrency(l.unitPrice, true)}</td>
                        <td className="py-1.5 text-right tabular-nums">{formatCurrency(quoteLineSell(l as QuoteLineLike))}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="py-1.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {section.name} subtotal
                      </td>
                      <td className="py-1.5 text-right font-semibold tabular-nums">{formatCurrency(sectionSell)}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </section>

      <section className="mt-6 flex justify-end break-inside-avoid">
        <table className="w-64 text-sm">
          <tbody>
            <tr>
              <td className="py-1 text-slate-500">Subtotal</td>
              <td className="py-1 text-right font-medium tabular-nums">{formatCurrency(totals.totalSell)}</td>
            </tr>
            {totals.totalTax > 0 && (
              <tr>
                <td className="py-1 text-slate-500">GST / tax</td>
                <td className="py-1 text-right font-medium tabular-nums">{formatCurrency(totals.totalTax)}</td>
              </tr>
            )}
            <tr className="border-t-2 border-slate-900">
              <td className="py-2 text-base font-bold">Total</td>
              <td className="py-2 text-right text-base font-bold tabular-nums">{formatCurrency(totals.totalWithTax)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {quote.exclusions && (
        <section className="mt-6 break-inside-avoid">
          <h3 className="text-sm font-bold uppercase tracking-wide">Exclusions</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{quote.exclusions}</p>
        </section>
      )}
      {quote.termsAndConditions && (
        <section className="mt-4 break-inside-avoid">
          <h3 className="text-sm font-bold uppercase tracking-wide">Terms &amp; conditions</h3>
          <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{quote.termsAndConditions}</p>
        </section>
      )}

      <section className="mt-10 break-inside-avoid border-t border-slate-300 pt-6 text-sm">
        <p className="text-slate-600">To accept this quotation, please sign and return, or reply confirming acceptance in writing.</p>
        <div className="mt-8 grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-slate-400 pb-8" />
            <div className="mt-1 text-xs text-slate-500">Signature</div>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8" />
            <div className="mt-1 text-xs text-slate-500">Name &amp; date</div>
          </div>
        </div>
      </section>
    </div>
  );
}
