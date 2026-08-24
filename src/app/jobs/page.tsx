import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { JobStatusBadge, TrafficBadge } from "@/components/Badge";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
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
        <Table>
          <THead>
            <Th>Job</Th>
            <Th>Customer</Th>
            <Th>Status</Th>
            <Th>{sortLink("value", sortKey, sortDir, "Contract value")}</Th>
            <Th>{sortLink("margin", sortKey, sortDir, "Forecast margin")}</Th>
            <Th>WIP</Th>
            <Th>{sortLink("cash", sortKey, sortDir, "Cash position")}</Th>
          </THead>
          <tbody>
            {sorted.map((jf) => (
              <Tr key={jf.job.id}>
                <Td className="font-medium">
                  <Link href={`/jobs/${jf.job.id}`} className="text-blue-600 hover:underline">
                    {jf.job.jobNumber}
                  </Link>
                </Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={jf.job.customer.name} />
                    <div>
                      <Link href={`/customers/${jf.job.customerId}`} className="font-medium hover:underline">
                        {jf.job.customer.name}
                      </Link>
                      {jf.job.site && <span className="block text-xs text-slate-400">{jf.job.site.name}</span>}
                    </div>
                  </div>
                </Td>
                <Td>
                  <JobStatusBadge status={jf.job.status} />
                </Td>
                <Td>
                  {formatCurrency(jf.revisedContractValue)}
                  {jf.approvedVariationsTotal !== 0 && (
                    <span className="block text-xs text-slate-400">incl. {formatCurrency(jf.approvedVariationsTotal)} variations</span>
                  )}
                </Td>
                <Td>
                  <TrafficBadge severity={jf.belowTargetMargin ? "red" : "green"} label={formatPercent(jf.forecast.forecastMarginPercent, 1)} />
                </Td>
                <Td>{formatCurrency(jf.wip.managementWip)}</Td>
                <Td>
                  <TrafficBadge severity={jf.heavyCashFunding ? "red" : jf.cash.cashPosition < 0 ? "orange" : "green"} label={formatCurrency(jf.cash.cashPosition)} />
                </Td>
              </Tr>
            ))}
            {sorted.length === 0 && <EmptyRow colSpan={7}>No jobs yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
