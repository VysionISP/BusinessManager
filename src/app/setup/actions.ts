"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, hashPassword } from "@/lib/auth";

export async function createFirstAdmin(formData: FormData) {
  const existing = await prisma.user.count();
  if (existing > 0) redirect("/login");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    redirect("/setup?error=1");
  }

  const user = await prisma.user.create({
    data: { name, email, passwordHash: hashPassword(password), role: "ADMIN" },
  });
  await createSession(user.id);
  redirect("/");
}
