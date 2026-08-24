import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/queries";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [session, userCount] = await Promise.all([getSession(), prisma.user.count()]);

  if (!session) {
    redirect(userCount === 0 ? "/setup" : "/login");
  }

  const settings = await getSettings();

  return (
    <AppShell businessName={settings.businessName} user={session}>
      {children}
    </AppShell>
  );
}
