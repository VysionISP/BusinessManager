import { redirect } from "next/navigation";
import { FormField, Button } from "@/components/FormField";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { login } from "./actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [session, userCount] = await Promise.all([getSession(), prisma.user.count()]);
  if (session) redirect("/");
  if (userCount === 0) redirect("/setup");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">V</span>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">Sign in</span>
        </div>
        {error && (
          <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Incorrect email or password.
          </p>
        )}
        <form action={login} className="space-y-4">
          <FormField label="Email" name="email" type="email" required />
          <FormField label="Password" name="password" type="password" required />
          <Button>Sign in</Button>
        </form>
      </div>
    </div>
  );
}
