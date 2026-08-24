import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { JobStatusBadge, TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getJobsWithFinancials } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SortKey = "margin" | "value" | "cash";

function sortJobs(jobs: Awaited<ReturnType<typeof getJobsWithFinancials>>, sort: SortKey, dir: "asc" | "desc") {
  const sorted = [...jobs].sort((a, b) => {
    let diff = 0;
    if (sort === "margin") diff = a.forecast.forecastMarginPercent - b.forecast.forecastMarginPercent;
    if (sort === "value") diff = a.revisedContractValue - b.revisedContractValue;
    if (sort === "cash") diff = a.cash.cashPosition - b.cash.cashPosition;
    return dir === "asc" ? diff : -diff;
  });
  return sorted;
}

function sortLink(sort: SortKey, currentSort: string, currentDir: string, label: string) {
  const nextDir = currentSort === sort && currentDir === "desc" ? "asc" : "desc";
  return (
    <Link href={`/jobs?sort=${sort}&dir=${nextDir}`} className="hover:text-slate-900 dark:hover:text-slate-100">
      {label} {currentSort === sort ? (currentDir === "desc" ? "↓" : "↑") : ""}
    </Link>
  );
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ sort?: string; dir?: string }> }) {
  const { sort, dir } = await searchParams;
  const sortKey: SortKey = sort === "value" || sort === "cash" ? sort : "margin";
  const sortDir = dir === "asc" ? "asc" : "desc";

  const jobs = await getJobsWithFinancials();
  const sorted = sortJobs(jobs, sortKey, sortDir);

  return (
    <div>
      <PageHeader
        title="Jobs"
        description="Every quoted or won job. Sort by margin to see your most and least profitable work; below-target jobs and overdue cash are flagged in red."
        actions={
          <Link href="/jobs/new">
            <Button>New job</Button>
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">{sortLink("value", sortKey, sortDir, "Contract value")}</th>
                <th className="py-2 pr-4">{sortLink("margin", sortKey, sortDir, "Forecast margin")}</th>
                <th className="py-2 pr-4">WIP</th>
                <th className="py-2 pr-4">{sortLink("cash", sortKey, sortDir, "Cash position")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((jf) => (
                <tr key={jf.job.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="py-2 pr-4 font-medium">
                    <Link href={`/jobs/${jf.job.id}`} className="text-blue-600 hover:underline">
                      {jf.job.jobNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">
                    <Link href={`/customers/${jf.job.customerId}`} className="hover:underline">
                      {jf.job.customer.name}
                    </Link>
                    {jf.job.site && <span className="block text-xs text-slate-400">{jf.job.site.name}</span>}
                  </td>
                  <td className="py-2 pr-4">
                    <JobStatusBadge status={jf.job.status} />
                  </td>
                  <td className="py-2 pr-4">
                    {formatCurrency(jf.revisedContractValue)}
                    {jf.approvedVariationsTotal !== 0 && (
                      <span className="block text-xs text-slate-400">incl. {formatCurrency(jf.approvedVariationsTotal)} variations</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">
                    <TrafficBadge severity={jf.belowTargetMargin ? "red" : "green"} label={formatPercent(jf.forecast.forecastMarginPercent, 1)} />
                  </td>
                  <td className="py-2 pr-4">{formatCurrency(jf.wip.managementWip)}</td>
                  <td className="py-2 pr-4">
                    <TrafficBadge severity={jf.heavyCashFunding ? "red" : jf.cash.cashPosition < 0 ? "orange" : "green"} label={formatCurrency(jf.cash.cashPosition)} />
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No jobs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
