"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession, hashPassword } from "@/lib/auth";
import { USER_ROLES } from "@/lib/types";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/settings");
  return session;
}

export async function createUser(formData: FormData) {
  await requireAdmin();

  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const role = str(formData, "role");

  if (!name || !email || password.length < 8 || !USER_ROLES.includes(role as (typeof USER_ROLES)[number])) {
    redirect("/settings/users/new?error=1");
  }

  try {
    await prisma.user.create({ data: { name, email, passwordHash: hashPassword(password), role } });
  } catch {
    redirect("/settings/users/new?error=email");
  }

  revalidatePath("/settings");
  redirect("/settings");
}

export async function updateUser(id: number, formData: FormData) {
  await requireAdmin();

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) redirect("/settings");

  const name = str(formData, "name") || target.name;
  const role = str(formData, "role") || target.role;
  const active = formData.get("active") === "on";
  const newPassword = str(formData, "password");

  // Never let the last active admin lock themselves (or everyone else) out.
  const wouldRemoveAdmin = target.role === "ADMIN" && target.active && (role !== "ADMIN" || !active);
  if (wouldRemoveAdmin) {
    const otherActiveAdmins = await prisma.user.count({ where: { role: "ADMIN", active: true, id: { not: id } } });
    if (otherActiveAdmins === 0) {
      redirect(`/settings/users/${id}/edit?error=last-admin`);
    }
  }

  await prisma.user.update({
    where: { id },
    data: {
      name,
      role,
      active,
      ...(newPassword && newPassword.length >= 8 ? { passwordHash: hashPassword(newPassword) } : {}),
    },
  });

  revalidatePath("/settings");
  redirect("/settings");
}
