import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormActions, FormField } from "@/components/FormField";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { USER_ROLE_LABELS } from "@/lib/types";
import { updateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);
  const isAdmin = session?.role === "ADMIN";
  const users = isAdmin ? await prisma.user.findMany({ orderBy: { name: "asc" } }) : [];

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Business-wide defaults used across the break-even, quoting, dashboard and cashflow calculations." />
      <Card>
        <form action={updateSettings} className="max-w-xl space-y-5">
          <FormField label="Business name" name="businessName" defaultValue={settings.businessName} required />
          <FormField
            label="Target profit margin (%)"
            name="targetMarginPercent"
            type="number"
            step="0.5"
            defaultValue={settings.targetMarginPercent}
            hint="Used as the default quoting margin and job margin alert threshold."
          />
          <FormField
            label="Target labour utilisation (%)"
            name="targetUtilisationPercent"
            type="number"
            step="1"
            defaultValue={settings.targetUtilisationPercent}
            hint="Billable hours as a percentage of available hours."
          />
          <FormField
            label="Current bank balance ($)"
            name="openingBankBalance"
            type="number"
            step="0.01"
            defaultValue={settings.openingBankBalance}
            hint="Update this to today's actual balance — it's the starting point for the cashflow forecast."
          />
          <FormActions>
            <Button>Save settings</Button>
          </FormActions>
        </form>
      </Card>

      {isAdmin && (
        <Card
          title="Users"
          icon={UserPlus}
          action={
            <Link href="/settings/users/new" className="text-xs font-medium text-indigo-600 hover:underline">
              + Add user
            </Link>
          }
        >
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th />
            </THead>
            <tbody>
              {users.map((u) => (
                <Tr key={u.id}>
                  <Td className="font-medium">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} />
                      {u.name}
                      {u.id === session?.id && <span className="text-xs text-slate-400">(you)</span>}
                    </div>
                  </Td>
                  <Td className="text-slate-500 dark:text-slate-400">{u.email}</Td>
                  <Td>{USER_ROLE_LABELS[u.role as keyof typeof USER_ROLE_LABELS] ?? u.role}</Td>
                  <Td>{u.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</Td>
                  <Td className="text-right">
                    <Link href={`/settings/users/${u.id}/edit`} className="text-indigo-600 hover:underline">
                      Edit
                    </Link>
                  </Td>
                </Tr>
              ))}
              {users.length === 0 && <EmptyRow colSpan={5}>No users yet.</EmptyRow>}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
