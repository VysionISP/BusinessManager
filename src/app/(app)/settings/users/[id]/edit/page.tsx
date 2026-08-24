import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { UserForm } from "../../UserForm";
import { updateUser } from "../../actions";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) notFound();

  const boundUpdate = updateUser.bind(null, user.id);

  return (
    <div>
      <PageHeader title={`Edit ${user.name}`} />
      {error === "last-admin" && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          This is the only active admin account — promote another user to admin first before changing this one.
        </p>
      )}
      <Card>
        <UserForm user={user} action={boundUpdate} />
      </Card>
    </div>
  );
}
