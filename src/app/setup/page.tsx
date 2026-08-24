import { redirect } from "next/navigation";
import { FormField, Button } from "@/components/FormField";
import { prisma } from "@/lib/db";
import { createFirstAdmin } from "./actions";

export const dynamic = "force-dynamic";

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const userCount = await prisma.user.count();
  if (userCount > 0) redirect("/login");

  const { error } = await searchParams;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">V</span>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">Create your admin account</span>
        </div>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          This is a one-time setup step — no accounts exist yet. This account will have full access, including managing other users.
        </p>
        {error && (
          <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
            Please fill in your name, email, and a password of at least 8 characters.
          </p>
        )}
        <form action={createFirstAdmin} className="space-y-4">
          <FormField label="Your name" name="name" required />
          <FormField label="Email" name="email" type="email" required />
          <FormField label="Password" name="password" type="password" hint="At least 8 characters." required />
          <Button>Create account</Button>
        </form>
      </div>
    </div>
  );
}
