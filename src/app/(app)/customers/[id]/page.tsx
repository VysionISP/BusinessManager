import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { JobStatusBadge } from "@/components/Badge";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { CUSTOMER_TYPE_LABELS, ENQUIRY_STATUS_LABELS } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCustomerDetail } from "@/lib/queries";
import { SiteForm } from "../SiteForm";
import { createSite, deleteSite, updateSite } from "../actions";
import { AssetForm } from "@/app/(app)/assets/AssetForm";
import { createAsset, deleteAsset, updateAsset } from "@/app/(app)/assets/actions";

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
            <Table>
              <THead>
                <Th>Job</Th>
                <Th>Description</Th>
                <Th>Status</Th>
                <Th>Quote amount</Th>
              </THead>
              <tbody>
                {customer.jobs.map((job) => (
                  <Tr key={job.id}>
                    <Td className="font-medium">
                      <Link href={`/jobs/${job.id}`} className="text-blue-600 hover:underline">
                        {job.jobNumber}
                      </Link>
                    </Td>
                    <Td>{job.description}</Td>
                    <Td>
                      <JobStatusBadge status={job.status} />
                    </Td>
                    <Td>{formatCurrency(job.quoteAmount)}</Td>
                  </Tr>
                ))}
                {customer.jobs.length === 0 && <EmptyRow colSpan={4}>No jobs yet.</EmptyRow>}
              </tbody>
            </Table>
            <Link href={`/jobs/new?customerId=${customerId}`} className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              + New job for this customer
            </Link>
          </Card>

          {customer.enquiries.length > 0 && (
            <Card title="Enquiries">
              <Table>
                <THead>
                  <Th>Date</Th>
                  <Th>Work requested</Th>
                  <Th>Status</Th>
                </THead>
                <tbody>
                  {customer.enquiries.map((e) => (
                    <Tr key={e.id}>
                      <Td>{formatDate(e.createdAt)}</Td>
                      <Td>
                        <Link href={`/enquiries/${e.id}`} className="text-blue-600 hover:underline">
                          {e.workRequested}
                        </Link>
                      </Td>
                      <Td>{ENQUIRY_STATUS_LABELS[e.status as keyof typeof ENQUIRY_STATUS_LABELS] ?? e.status}</Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
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

          <Card title="Assets">
            <div className="space-y-2">
              {customer.assets.map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {a.type} {a.location && `— ${a.location}`}
                    </span>
                    <form action={deleteAsset.bind(null, customerId, a.id)}>
                      <button type="submit" className="text-xs text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {a.manufacturer} {a.model} {a.serialNumber && `· S/N ${a.serialNumber}`}
                    {a.nextServiceDate && ` · Next service ${formatDate(a.nextServiceDate)}`}
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-medium text-blue-600">Edit asset</summary>
                    <div className="mt-2">
                      <AssetForm asset={a} sites={customer.sites} action={updateAsset.bind(null, customerId, a.id)} submitLabel="Save asset" />
                    </div>
                  </details>
                </div>
              ))}
              {customer.assets.length === 0 && <p className="text-sm text-slate-400">No assets recorded yet.</p>}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-blue-600">+ Add an asset</summary>
              <div className="mt-3">
                <AssetForm sites={customer.sites} action={createAsset.bind(null, customerId)} />
              </div>
            </details>
          </Card>
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
