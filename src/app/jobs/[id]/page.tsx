import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormField } from "@/components/FormField";
import { JobStatusBadge, TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { progressClaimSummary } from "@/lib/calculations";
import { getJobDetail } from "@/lib/queries";
import { JOB_STATUSES, JOB_STATUS_LABELS, PO_STATUS_LABELS, PRICING_METHOD_LABELS } from "@/lib/types";
import { ChargeUpInvoiceForm } from "./ChargeUpInvoiceForm";
import { CostEntryForm } from "./CostEntryForm";
import { InvoiceForm } from "./InvoiceForm";
import { InvoiceRow } from "./InvoiceRow";
import { PhaseList } from "./PhaseList";
import { VariationList } from "./VariationList";
import {
  addCostEntry,
  addInvoice,
  addPayment,
  createChargeUpInvoice,
  deleteCostEntry,
  deleteInvoice,
  deleteJob,
  deletePayment,
  updateJobProgress,
} from "../actions";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  LABOUR: "Labour",
  MATERIALS: "Materials",
  SUBCONTRACTOR: "Subcontractor",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
};

function BudgetRow({ label, budget, actual }: { label: string; budget: number; actual: number }) {
  const variance = actual - budget;
  const over = budget > 0 && variance > 0;
  return (
    <tr className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
      <td className="py-2 pr-4 font-medium">{label}</td>
      <td className="py-2 pr-4">{formatCurrency(budget)}</td>
      <td className="py-2 pr-4">{formatCurrency(actual)}</td>
      <td className={`py-2 pr-4 ${over ? "text-rose-600" : "text-emerald-600"}`}>
        {variance >= 0 ? "+" : ""}
        {formatCurrency(variance)}
      </td>
    </tr>
  );
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const jobId = Number(id);
  const detail = await getJobDetail(jobId);
  if (!detail) notFound();
  const { job, financials } = detail;

  const boundAddCostEntry = addCostEntry.bind(null, jobId);
  const boundAddInvoice = addInvoice.bind(null, jobId);
  const boundUpdateProgress = updateJobProgress.bind(null, jobId);
  const boundDeleteJob = deleteJob.bind(null, jobId);

  return (
    <div>
      <PageHeader
        title={`${job.jobNumber} — ${job.customer.name}`}
        description={job.description}
        actions={
          <div className="flex items-center gap-2">
            <JobStatusBadge status={job.status} />
            <Link href={`/jobs/${jobId}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <form action={boundDeleteJob}>
              <Button variant="danger">Delete</Button>
            </form>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
        <div>
          Customer{" "}
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
            <Link href={`/customers/${job.customerId}`} className="hover:underline">
              {job.customer.name}
            </Link>
          </div>
        </div>
        <div>
          Site <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{job.site?.name ?? "—"}</div>
        </div>
        <div>
          Project manager <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{job.projectManager?.name ?? "Unassigned"}</div>
        </div>
        <div>
          Pricing method{" "}
          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{PRICING_METHOD_LABELS[job.pricingMethod as keyof typeof PRICING_METHOD_LABELS] ?? job.pricingMethod}</div>
        </div>
        <div>
          Quote date <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(job.quoteDate)}</div>
        </div>
        <div>
          Start date <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(job.startDate)}</div>
        </div>
        <div>
          Expected completion <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(job.expectedCompletionDate)}</div>
        </div>
        <div>
          Target margin <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatPercent(financials.targetMarginPercent)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Budget vs actual">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Budget</th>
                  <th className="py-2 pr-4">Actual</th>
                  <th className="py-2 pr-4">Variance</th>
                </tr>
              </thead>
              <tbody>
                <BudgetRow label="Labour" budget={job.budgetLabourCost} actual={financials.actual.labour} />
                <BudgetRow label="Materials" budget={job.budgetMaterials} actual={financials.actual.materials} />
                <BudgetRow label="Subcontractors" budget={job.budgetSubcontractors} actual={financials.actual.subcontractor} />
                <BudgetRow label="Other direct costs" budget={job.budgetOtherDirectCosts} actual={financials.actual.equipment + financials.actual.other} />
                <BudgetRow label="Total" budget={financials.budgetTotal} actual={financials.actual.total} />
              </tbody>
            </table>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              Labour hours: {financials.actual.labourHours.toFixed(1)} actual vs {job.budgetLabourHours.toFixed(1)} budgeted
              {financials.overBudgetLabourHours && <span className="ml-2 font-medium text-rose-600">over budget</span>}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-5">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Expected profit</div>
                <div className="font-semibold">{formatCurrency(financials.expectedProfit)}</div>
                <div className="text-xs text-slate-400">{formatPercent(financials.expectedMarginPercent, 1)} margin</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Committed (open POs)</div>
                <div className="font-semibold">{formatCurrency(financials.forecast.committedCost)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Forecast final cost</div>
                <div className="font-semibold">{formatCurrency(financials.forecast.forecastFinalCost)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Forecast profit</div>
                <div className="font-semibold">{formatCurrency(financials.forecast.forecastProfit)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Forecast margin</div>
                <TrafficBadge severity={financials.belowTargetMargin ? "red" : "green"} label={formatPercent(financials.forecast.forecastMarginPercent, 1)} />
              </div>
            </div>
          </Card>

          <Card title="Job phases">
            <PhaseList jobId={jobId} phases={job.phases} costEntries={job.costEntries} />
          </Card>

          <Card title="Variations">
            <VariationList jobId={jobId} variations={job.variations} />
          </Card>

          <Card
            title="Purchase orders"
            action={
              <Link href={`/purchase-orders/new?jobId=${jobId}`} className="text-xs font-medium text-blue-600 hover:underline">
                + New PO
              </Link>
            }
          >
            {job.purchaseOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2 pr-4">PO #</th>
                      <th className="py-2 pr-4">Supplier</th>
                      <th className="py-2 pr-4">Total</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.purchaseOrders.map((po) => (
                      <tr key={po.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                        <td className="py-2 pr-4 font-medium">
                          <Link href={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline">
                            {po.poNumber}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{po.supplier.name}</td>
                        <td className="py-2 pr-4">{formatCurrency(po.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0))}</td>
                        <td className="py-2 pr-4">
                          <TrafficBadge
                            severity={po.status === "CLOSED" || po.status === "INVOICED" ? "green" : po.status === "CANCELLED" ? "red" : "orange"}
                            label={PO_STATUS_LABELS[po.status as keyof typeof PO_STATUS_LABELS] ?? po.status}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No purchase orders raised for this job yet.</p>
            )}
          </Card>

          <Card title="Actual costs">
            <div className="mb-4">
              <CostEntryForm action={boundAddCostEntry} phases={job.phases} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Hours</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4" />
                  </tr>
                </thead>
                <tbody>
                  {job.costEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 pr-4">{formatDate(entry.date)}</td>
                      <td className="py-2 pr-4">{CATEGORY_LABELS[entry.category] ?? entry.category}</td>
                      <td className="py-2 pr-4">{entry.description}</td>
                      <td className="py-2 pr-4">{entry.hours ?? "—"}</td>
                      <td className="py-2 pr-4">{formatCurrency(entry.amount)}</td>
                      <td className="py-2 pr-4 text-right">
                        <form action={deleteCostEntry.bind(null, jobId, entry.id)}>
                          <button type="submit" className="text-xs text-rose-600 hover:underline">
                            Delete
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {job.costEntries.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        No costs recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {job.pricingMethod === "CHARGE_UP" && (
            <Card title="Charge-up invoicing — unbilled costs">
              <ChargeUpInvoiceForm unbilledEntries={job.costEntries.filter((e) => !e.invoiceId)} action={createChargeUpInvoice.bind(null, jobId)} />
            </Card>
          )}

          <Card title="Invoices & payments">
            <div className="mb-4">
              <InvoiceForm action={boundAddInvoice} />
            </div>
            <div className="space-y-3">
              {financials.invoices.map((inv) => {
                const rawInvoice = job.invoices.find((i) => i.id === inv.id)!;
                return (
                  <InvoiceRow
                    key={inv.id}
                    invoice={inv}
                    payments={rawInvoice.payments}
                    addPaymentAction={addPayment.bind(null, jobId, inv.id)}
                    deletePaymentAction={deletePayment.bind(null, jobId)}
                    deleteInvoiceAction={deleteInvoice.bind(null, jobId, inv.id)}
                  />
                );
              })}
              {financials.invoices.length === 0 && <p className="py-4 text-center text-slate-400">No invoices raised yet.</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Progress & status">
            <form action={boundUpdateProgress} className="space-y-4">
              <FormField
                label="Status"
                name="status"
                defaultValue={job.status}
                options={JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABELS[s] }))}
              />
              <FormField label="% complete" name="percentComplete" type="number" step="5" defaultValue={job.percentComplete} />
              <Button>Update</Button>
            </form>
          </Card>

          <Card title="Work in progress (management estimate)">
            <div className="space-y-2 text-sm">
              <Row label="Original quote" value={formatCurrency(financials.originalQuoteAmount)} />
              {financials.approvedVariationsTotal !== 0 && (
                <Row label="Approved variations" value={formatCurrency(financials.approvedVariationsTotal)} />
              )}
              <Row label="Contract value" value={formatCurrency(financials.wip.contractValue)} bold={financials.approvedVariationsTotal !== 0} />
              <Row label={`Earned value (${job.percentComplete}% complete)`} value={formatCurrency(financials.wip.earnedValue)} />
              <Row label="Total invoiced" value={formatCurrency(financials.wip.totalInvoiced)} />
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              <Row label="Management WIP" value={formatCurrency(financials.wip.managementWip)} bold />
            </div>
            <p className="mt-3 text-xs text-slate-400">Work completed but not yet invoiced. This is a management indicator, not formal revenue recognition.</p>
          </Card>

          <Card title="Job cash position">
            <div className="space-y-2 text-sm">
              <Row label="Spent to date" value={formatCurrency(financials.cash.cashSpent)} />
              <Row label="Received to date" value={formatCurrency(financials.cash.cashReceived)} />
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              <div className="flex items-center justify-between">
                <span className="font-medium">Cash position</span>
                <TrafficBadge severity={financials.heavyCashFunding ? "red" : financials.cash.cashPosition < 0 ? "orange" : "green"} label={formatCurrency(financials.cash.cashPosition)} />
              </div>
            </div>
            {financials.cash.cashPosition < 0 && (
              <p className="mt-3 text-xs text-slate-400">
                The business is currently funding {formatCurrency(-financials.cash.cashPosition)} on this job.
              </p>
            )}
          </Card>

          <Card title="Outstanding">
            <div className="space-y-2 text-sm">
              <Row label="Total invoiced" value={formatCurrency(financials.totalInvoiced)} />
              <Row label="Total received" value={formatCurrency(financials.totalReceived)} />
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              <Row label="Outstanding" value={formatCurrency(financials.totalOutstanding)} bold />
              {financials.hasOverdueInvoice && <p className="text-xs font-medium text-rose-600">One or more invoices are overdue.</p>}
            </div>
          </Card>

          {job.retentionPercent > 0 && (
            <Card title="Progress claim summary">
              {(() => {
                const claim = progressClaimSummary(financials.revisedContractValue, financials.totalInvoiced, job.invoices, job.retentionPercent);
                return (
                  <div className="space-y-2 text-sm">
                    <Row label="Revised contract value" value={formatCurrency(claim.revisedContractValue)} />
                    <Row label="Claimed to date" value={formatCurrency(claim.totalClaimedToDate)} />
                    <Row label="Remaining contract" value={formatCurrency(claim.remainingContract)} />
                    <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
                    <Row label={`Retention held (${job.retentionPercent}%)`} value={formatCurrency(claim.retentionHeld)} bold />
                  </div>
                );
              })()}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={bold ? "font-semibold text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-300"}>{value}</span>
    </div>
  );
}
