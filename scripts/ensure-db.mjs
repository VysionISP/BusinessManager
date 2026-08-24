// Runs before `next dev` / `next start` so a fresh clone (or a pull that
// added migrations) can never boot against a missing or out-of-date
// database — the single most common cause of "nothing saves / nothing
// works" reports. Creates .env from .env.example when absent, then
// applies any pending migrations.
import { copyFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const envFile = join(root, ".env");
if (!existsSync(envFile) && existsSync(join(root, ".env.example"))) {
  copyFileSync(join(root, ".env.example"), envFile);
  console.log("[ensure-db] created .env from .env.example");
}

try {
  execFileSync("npx", ["prisma", "migrate", "deploy"], { cwd: root, stdio: "inherit" });
} catch {
  console.error(
    "[ensure-db] prisma migrate deploy failed — the app may not work until the database is migrated (try `npm run db:migrate`).",
  );
  process.exit(1);
}
