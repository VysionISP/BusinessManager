import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
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
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Contact</Th>
            <Th>Terms</Th>
            <Th>POs</Th>
            <Th>Invoices</Th>
            <Th>Status</Th>
            <Th />
          </THead>
          <tbody>
            {suppliers.map((s) => (
              <Tr key={s.id}>
                <Td className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} />
                    {s.name}
                  </div>
                </Td>
                <Td className="text-slate-500 dark:text-slate-400">{s.contactName ?? s.phone ?? s.email ?? "—"}</Td>
                <Td>{s.paymentTermsDays} days</Td>
                <Td>{s._count.purchaseOrders}</Td>
                <Td>{s._count.supplierInvoices}</Td>
                <Td>{s.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/suppliers/${s.id}/edit`} className="text-indigo-600 hover:underline">
                      Edit
                    </Link>
                    <form action={deleteSupplier.bind(null, s.id)}>
                      <button type="submit" className="text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </Td>
              </Tr>
            ))}
            {suppliers.length === 0 && <EmptyRow colSpan={7}>No suppliers yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
