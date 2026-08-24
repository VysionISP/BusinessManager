import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
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
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Main contact</Th>
            <Th>Sites</Th>
            <Th>Jobs</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {customers.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={c.name} />
                    <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline">
                      {c.name}
                    </Link>
                  </div>
                </Td>
                <Td className="text-slate-500 dark:text-slate-400">
                  {CUSTOMER_TYPE_LABELS[c.customerType as keyof typeof CUSTOMER_TYPE_LABELS] ?? c.customerType}
                </Td>
                <Td>{c.mainContactName ?? c.phone ?? c.email ?? "—"}</Td>
                <Td>{c.sites.length}</Td>
                <Td>{c._count.jobs}</Td>
                <Td>{c.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</Td>
              </Tr>
            ))}
            {customers.length === 0 && <EmptyRow colSpan={6}>No customers yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
