import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Billable hrs/wk</th>
                <th className="py-2 pr-4">True weekly cost</th>
                <th className="py-2 pr-4">Cost / billable hr</th>
                <th className="py-2 pr-4">Charge-out rate</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4" />
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const cost = employeeTrueCost(e);
                const margin = e.chargeOutRate - cost.costPerBillableHour;
                return (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium">{e.name}</td>
                    <td className="py-2 pr-4 text-slate-600 dark:text-slate-300">{e.role}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                      {e.employeeType === "EMPLOYEE" ? "Employee" : "Subcontractor"} · {e.payType === "HOURLY" ? "Hourly" : "Salary"}
                    </td>
                    <td className="py-2 pr-4">{formatHours(e.expectedBillableHoursPerWeek)}</td>
                    <td className="py-2 pr-4">{formatCurrency(cost.totalCost)}</td>
                    <td className="py-2 pr-4">{formatCurrency(cost.costPerBillableHour, true)}</td>
                    <td className="py-2 pr-4">
                      {formatCurrency(e.chargeOutRate, true)}{" "}
                      <span className={margin >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        ({margin >= 0 ? "+" : ""}
                        {formatCurrency(margin, true)})
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      {e.active ? (
                        <span className="text-emerald-600">Active</span>
                      ) : (
                        <span className="text-slate-400">Inactive</span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <div className="flex justify-end gap-3">
                        <Link href={`/employees/${e.id}/edit`} className="text-blue-600 hover:underline">
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
                    </td>
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-slate-400">
                    No employees yet.
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
