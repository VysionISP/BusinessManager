import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { CUSTOMER_TYPE_LABELS } from "@/lib/types";
import { getCustomers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div>
      <PageHeader
        title="Customers"
        description="The person or organisation responsible for the work or account. Each customer can have multiple sites, jobs and quotes."
        actions={
          <Link href="/customers/new">
            <Button>Add customer</Button>
          </Link>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Main contact</th>
                <th className="py-2 pr-4">Sites</th>
                <th className="py-2 pr-4">Jobs</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="py-2 pr-4 font-medium">
                    <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">
                      {c.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{CUSTOMER_TYPE_LABELS[c.customerType as keyof typeof CUSTOMER_TYPE_LABELS] ?? c.customerType}</td>
                  <td className="py-2 pr-4">{c.mainContactName ?? c.phone ?? c.email ?? "—"}</td>
                  <td className="py-2 pr-4">{c.sites.length}</td>
                  <td className="py-2 pr-4">{c._count.jobs}</td>
                  <td className="py-2 pr-4">{c.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No customers yet.
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
