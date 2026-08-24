"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/employees", label: "Employees" },
  { href: "/payroll", label: "Payroll" },
  { href: "/overheads", label: "Overheads" },
  { href: "/expenses", label: "Expenses" },
  { href: "/break-even", label: "Break-even" },
  { href: "/quotes", label: "Quote calculator" },
  { href: "/jobs", label: "Jobs" },
  { href: "/cashflow", label: "Cashflow" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:px-6">
        <span className="mr-4 shrink-0 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Voltline<span className="text-blue-600">.</span>
        </span>
        <div className="flex flex-wrap gap-1">
          {LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
