import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { UserForm } from "../UserForm";
import { createUser } from "../actions";

export default async function NewUserPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div>
      <PageHeader title="Add user" description="Create a login for a team member." />
      {error && (
        <p className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {error === "email" ? "That email is already in use." : "Please fill in a name, email, role and a password of at least 8 characters."}
        </p>
      )}
      <Card>
        <UserForm action={createUser} />
      </Card>
    </div>
  );
}
