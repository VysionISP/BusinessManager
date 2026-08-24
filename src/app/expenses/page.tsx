import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import { OVERHEAD_CATEGORIES, OVERHEAD_CATEGORY_LABELS } from "@/lib/types";
import { createExpense, deleteExpense } from "./actions";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({ orderBy: { date: "desc" } });
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Log what the business actually spends — day to day, one-off purchases, anything not tied to a specific job. This feeds the management P&L. (Recurring costs you already know about — insurance, subscriptions, rego — belong in Overheads instead, so they're built into the break-even rate.)"
      />

      <Card title="Add an expense">
        <form action={createExpense} className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
          <FormField label="Date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
          <FormField
            label="Category"
            name="category"
            defaultValue="OTHER"
            options={OVERHEAD_CATEGORIES.map((c) => ({ value: c, label: OVERHEAD_CATEGORY_LABELS[c] }))}
          />
          <div className="col-span-2 sm:col-span-2">
            <FormField label="What is it?" name="description" required hint="e.g. New drill, fuel top-up, site parking" />
          </div>
          <FormField label="Amount ($)" name="amount" type="number" step="0.01" required />
          <button
            type="submit"
            className="col-span-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 sm:col-span-1"
          >
            Add expense
          </button>
        </form>
      </Card>

      <div className="mt-5">
        <Card title="Expense history">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4">{formatDate(e.date)}</td>
                    <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                      {OVERHEAD_CATEGORY_LABELS[e.category as keyof typeof OVERHEAD_CATEGORY_LABELS] ?? e.category}
                    </td>
                    <td className="py-2 pr-4">{e.description}</td>
                    <td className="py-2 pr-4">{formatCurrency(e.amount, true)}</td>
                    <td className="py-2 pr-4 text-right">
                      <form action={deleteExpense.bind(null, e.id)}>
                        <button type="submit" className="text-xs text-rose-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No expenses recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-sm text-slate-500 dark:text-slate-400">Total recorded expenses</span>
        <div className="text-2xl font-semibold text-blue-600">{formatCurrency(total)}</div>
      </div>
    </div>
  );
}
