import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { prisma } from "@/lib/db";
import { deleteSupplier } from "./actions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { purchaseOrders: true, supplierInvoices: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Suppliers you order materials, equipment or subcontract labour from."
        actions={
          <Link href="/suppliers/new">
            <Button>Add supplier</Button>
          </Link>
        }
      />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Contact</th>
                <th className="py-2 pr-4">Terms</th>
                <th className="py-2 pr-4">POs</th>
                <th className="py-2 pr-4">Invoices</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="py-2 pr-4 font-medium">{s.name}</td>
                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">{s.contactName ?? s.phone ?? s.email ?? "—"}</td>
                  <td className="py-2 pr-4">{s.paymentTermsDays} days</td>
                  <td className="py-2 pr-4">{s._count.purchaseOrders}</td>
                  <td className="py-2 pr-4">{s._count.supplierInvoices}</td>
                  <td className="py-2 pr-4">{s.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</td>
                  <td className="py-2 pr-4 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/suppliers/${s.id}/edit`} className="text-blue-600 hover:underline">
                        Edit
                      </Link>
                      <form action={deleteSupplier.bind(null, s.id)}>
                        <button type="submit" className="text-rose-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No suppliers yet.
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
