import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { addDays } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { getCustomers } from "@/lib/queries";
import { RecurringTemplateForm } from "./RecurringTemplateForm";
import { createRecurringTemplate, deleteRecurringTemplate, generateJobFromTemplate } from "./actions";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const [assets, templates, customers] = await Promise.all([
    prisma.asset.findMany({ include: { customer: true, site: true }, orderBy: { nextServiceDate: "asc" } }),
    prisma.recurringJobTemplate.findMany({ where: { active: true }, include: { customer: true }, orderBy: { nextDueDate: "asc" } }),
    getCustomers(true),
  ]);

  const soon = addDays(new Date(), 30);

  return (
    <div>
      <PageHeader
        title="Assets & recurring jobs"
        description="Customer equipment that needs periodic testing or servicing, and the recurring job templates that generate that work automatically."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Assets due for service">
          <div className="space-y-2">
            {assets.map((a) => {
              const overdue = a.nextServiceDate && a.nextServiceDate < new Date();
              const dueSoon = a.nextServiceDate && a.nextServiceDate <= soon && !overdue;
              return (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
                  <div>
                    <Link href={`/customers/${a.customerId}`} className="font-medium text-indigo-600 hover:underline">
                      {a.customer.name}
                    </Link>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {a.type} {a.site && `· ${a.site.name}`}
                    </div>
                  </div>
                  {a.nextServiceDate ? (
                    <TrafficBadge severity={overdue ? "red" : dueSoon ? "orange" : "green"} label={formatDate(a.nextServiceDate)} />
                  ) : (
                    <span className="text-xs text-slate-400">No date set</span>
                  )}
                </div>
              );
            })}
            {assets.length === 0 && <p className="text-sm text-slate-400">No assets recorded yet — add one from a customer&apos;s page.</p>}
          </div>
        </Card>

        <Card title="Recurring job templates">
          <div className="mb-4">
            <RecurringTemplateForm action={createRecurringTemplate} customers={customers} />
          </div>
          <div className="space-y-2">
            {templates.map((t) => {
              const due = t.nextDueDate <= new Date();
              return (
                <div key={t.id} className="rounded-lg border border-slate-100 p-3 text-sm dark:border-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {t.customer.name} · every {t.frequencyMonths} months
                        {t.defaultQuoteAmount > 0 && ` · ${formatCurrency(t.defaultQuoteAmount)}`}
                      </div>
                    </div>
                    <TrafficBadge severity={due ? "orange" : "green"} label={`Due ${formatDate(t.nextDueDate)}`} />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <form action={generateJobFromTemplate.bind(null, t.id)}>
                      <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700">
                        Generate job now
                      </button>
                    </form>
                    <form action={deleteRecurringTemplate.bind(null, t.id)}>
                      <button type="submit" className="text-xs text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
            {templates.length === 0 && <p className="text-sm text-slate-400">No recurring templates yet.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
