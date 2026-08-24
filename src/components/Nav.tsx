"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLink {
  href: string;
  label: string;
}
interface NavGroup {
  label: string;
  links: NavLink[];
}

type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "links" in item;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard" },
  {
    label: "Sales",
    links: [
      { href: "/enquiries", label: "Enquiries" },
      { href: "/customers", label: "Customers" },
      { href: "/quotes", label: "Quotes" },
    ],
  },
  {
    label: "Jobs",
    links: [
      { href: "/jobs", label: "All jobs" },
      { href: "/scheduling", label: "Scheduling" },
    ],
  },
  {
    label: "Purchasing",
    links: [
      { href: "/suppliers", label: "Suppliers" },
      { href: "/purchase-orders", label: "Purchase orders" },
    ],
  },
  {
    label: "Finance",
    links: [
      { href: "/employees", label: "Employees" },
      { href: "/payroll", label: "Payroll" },
      { href: "/overheads", label: "Overheads" },
      { href: "/expenses", label: "Expenses" },
      { href: "/break-even", label: "Break-even" },
      { href: "/quote-calculator", label: "Quote calculator" },
      { href: "/cashflow", label: "Cashflow" },
      { href: "/budget", label: "Budget vs actual" },
    ],
  },
  { href: "/reports", label: "Reports" },
  {
    label: "Compliance",
    links: [
      { href: "/forms", label: "Forms & certificates" },
      { href: "/assets", label: "Assets & recurring jobs" },
    ],
  },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="relative z-20 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-1 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="mr-4 shrink-0 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Voltline<span className="text-blue-600">.</span>
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          {NAV.map((item) => {
            if (!isGroup(item)) {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }

            const groupActive = item.links.some((l) => isActive(pathname, l.href));
            return (
              <details key={item.label} className="group relative">
                <summary
                  className={`flex cursor-pointer list-none items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors [&::-webkit-details-marker]:hidden ${
                    groupActive
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                  }`}
                >
                  {item.label}
                  <span className="text-[10px] text-slate-400 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="absolute left-0 top-full z-30 mt-1 min-w-[180px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                  {item.links.map((link) => {
                    const active = isActive(pathname, link.href);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={`block rounded-md px-3 py-1.5 text-sm ${
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
              </details>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
