import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { employeeTrueCost } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { getEmployees } from "@/lib/queries";
import { deleteEmployee } from "./actions";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div>
      <PageHeader
        title="Employees"
        description="True weekly cost = gross wage + super + other employer on-costs, divided by billable hours to get a true cost per billable hour."
        actions={
          <Link href="/employees/new">
            <Button>Add employee</Button>
          </Link>
        }
      />

      <Card>
        <Table>
          <THead>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Type</Th>
            <Th>Billable hrs/wk</Th>
            <Th>True weekly cost</Th>
            <Th>Cost / billable hr</Th>
            <Th>Charge-out rate</Th>
            <Th>Status</Th>
            <Th />
          </THead>
          <tbody>
            {employees.map((e) => {
              const cost = employeeTrueCost(e);
              const margin = e.chargeOutRate - cost.costPerBillableHour;
              return (
                <Tr key={e.id}>
                  <Td className="font-medium">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={e.name} />
                      {e.name}
                    </div>
                  </Td>
                  <Td className="text-slate-600 dark:text-slate-300">{e.role}</Td>
                  <Td className="text-slate-500 dark:text-slate-400">
                    {e.employeeType === "EMPLOYEE" ? "Employee" : "Subcontractor"} · {e.payType === "HOURLY" ? "Hourly" : "Salary"}
                  </Td>
                  <Td>{formatHours(e.expectedBillableHoursPerWeek)}</Td>
                  <Td>{formatCurrency(cost.totalCost)}</Td>
                  <Td>{formatCurrency(cost.costPerBillableHour, true)}</Td>
                  <Td>
                    {formatCurrency(e.chargeOutRate, true)}{" "}
                    <span className={margin >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      ({margin >= 0 ? "+" : ""}
                      {formatCurrency(margin, true)})
                    </span>
                  </Td>
                  <Td>{e.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/employees/${e.id}/edit`} className="text-indigo-600 hover:underline">
                        Edit
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await deleteEmployee(e.id);
                        }}
                      >
                        <button type="submit" className="text-rose-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </Td>
                </Tr>
              );
            })}
            {employees.length === 0 && <EmptyRow colSpan={9}>No employees yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
