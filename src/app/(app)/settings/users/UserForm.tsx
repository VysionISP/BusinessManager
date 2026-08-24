import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { USER_ROLES, USER_ROLE_DESCRIPTIONS, USER_ROLE_LABELS } from "@/lib/types";
import type { User } from "@prisma/client";

export function UserForm({ user, action }: { user?: User; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Name" name="name" defaultValue={user?.name} required />
        {user ? (
          <div className="text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Email</span>
            <div className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              {user.email}
            </div>
          </div>
        ) : (
          <FormField label="Email" name="email" type="email" required />
        )}
      </div>

      <FormField
        label={user ? "New password" : "Password"}
        name="password"
        type="password"
        required={!user}
        hint={user ? "Leave blank to keep the current password. At least 8 characters." : "At least 8 characters."}
      />

      <FormField
        label="Role"
        name="role"
        defaultValue={user?.role ?? "OFFICE"}
        options={USER_ROLES.map((r) => ({ value: r, label: USER_ROLE_LABELS[r] }))}
        hint={USER_ROLE_DESCRIPTIONS[(user?.role as (typeof USER_ROLES)[number]) ?? "OFFICE"]}
      />

      {user && (
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="active" defaultChecked={user.active} className="rounded border-slate-300" />
          Active
        </label>
      )}

      <FormActions>
        <Button>{user ? "Save user" : "Create user"}</Button>
        <Link href="/settings" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
