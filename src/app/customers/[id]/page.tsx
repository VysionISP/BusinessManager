import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { JobStatusBadge } from "@/components/Badge";
import { CUSTOMER_TYPE_LABELS, ENQUIRY_STATUS_LABELS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCustomerDetail } from "@/lib/queries";
import { SiteForm } from "../SiteForm";
import { createSite, deleteSite, updateSite } from "../actions";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customerId = Number(id);
  const customer = await getCustomerDetail(customerId);
  if (!customer) notFound();

  const boundCreateSite = createSite.bind(null, customerId);

  return (
    <div>
      <PageHeader
        title={customer.name}
        description={CUSTOMER_TYPE_LABELS[customer.customerType as keyof typeof CUSTOMER_TYPE_LABELS] ?? customer.customerType}
        actions={
          <Link href={`/customers/${customerId}/edit`}>
            <Button variant="secondary">Edit customer</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Sites">
            <div className="space-y-3">
              {customer.sites.map((site) => (
                <div key={site.id} className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium">{site.name}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{site.address}</div>
                      {site.contactName && (
                        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Site contact: {site.contactName} {site.contactPhone && `· ${site.contactPhone}`}
                        </div>
                      )}
                      {site.accessInstructions && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Access: {site.accessInstructions}</div>}
                      {site.hazardsNotes && <div className="mt-1 text-xs text-rose-600">Hazards: {site.hazardsNotes}</div>}
                    </div>
                    <form action={deleteSite.bind(null, customerId, site.id)}>
                      <button type="submit" className="shrink-0 text-xs text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-blue-600">Edit site</summary>
                    <div className="mt-3">
                      <SiteForm site={site} action={updateSite.bind(null, customerId, site.id)} submitLabel="Save site" />
                    </div>
                  </details>
                </div>
              ))}
              {customer.sites.length === 0 && <p className="text-sm text-slate-400">No sites added yet.</p>}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-blue-600">+ Add a site</summary>
              <div className="mt-3">
                <SiteForm action={boundCreateSite} />
              </div>
            </details>
          </Card>

          <Card title="Jobs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-4">Job</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Quote amount</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.jobs.map((job) => (
                    <tr key={job.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 pr-4 font-medium">
                        <Link href={`/jobs/${job.id}`} className="text-blue-600 hover:underline">
                          {job.jobNumber}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{job.description}</td>
                      <td className="py-2 pr-4">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="py-2 pr-4">{formatCurrency(job.quoteAmount)}</td>
                    </tr>
                  ))}
                  {customer.jobs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No jobs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Link href={`/jobs/new?customerId=${customerId}`} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              + New job for this customer
            </Link>
          </Card>

          {customer.enquiries.length > 0 && (
            <Card title="Enquiries">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-2 pr-4">Date</th>
                      <th className="py-2 pr-4">Work requested</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.enquiries.map((e) => (
                      <tr key={e.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                        <td className="py-2 pr-4">{formatDate(e.createdAt)}</td>
                        <td className="py-2 pr-4">
                          <Link href={`/enquiries/${e.id}`} className="text-blue-600 hover:underline">
                            {e.workRequested}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">{ENQUIRY_STATUS_LABELS[e.status as keyof typeof ENQUIRY_STATUS_LABELS] ?? e.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Contact details">
            <div className="space-y-2 text-sm">
              {customer.mainContactName && <Row label="Main contact" value={customer.mainContactName} />}
              {customer.mainContactPhone && <Row label="Phone" value={customer.mainContactPhone} />}
              {customer.mainContactEmail && <Row label="Email" value={customer.mainContactEmail} />}
              {customer.billingAddress && <Row label="Billing address" value={customer.billingAddress} />}
              <Row label="Payment terms" value={`${customer.paymentTermsDays} days`} />
              {customer.accountNumber && <Row label="Account #" value={customer.accountNumber} />}
              {customer.source && <Row label="Source" value={customer.source} />}
            </div>
            {customer.notes && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">{customer.notes}</div>
            )}
          </Card>

          {customer.assets.length > 0 && (
            <Card title="Assets">
              <ul className="space-y-2 text-sm">
                {customer.assets.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <span>
                      {a.type} {a.location && `— ${a.location}`}
                    </span>
                    <span className="text-xs text-slate-400">{a.nextServiceDate ? `Due ${formatDate(a.nextServiceDate)}` : ""}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-slate-700 dark:text-slate-300">{value}</span>
    </div>
  );
}
