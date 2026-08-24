"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BarChart3,
  Briefcase,
  Calculator,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  LineChart,
  Menu,
  PieChart,
  Receipt,
  Scale,
  Settings as SettingsIcon,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}
interface NavGroup {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
}
type NavItem = NavLink | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "links" in item;
}

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Sales",
    icon: Inbox,
    links: [
      { href: "/enquiries", label: "Enquiries", icon: Inbox },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/quotes", label: "Quotes", icon: FileText },
    ],
  },
  {
    label: "Jobs",
    icon: Briefcase,
    links: [
      { href: "/jobs", label: "All jobs", icon: Briefcase },
      { href: "/scheduling", label: "Scheduling", icon: CalendarDays },
    ],
  },
  {
    label: "Purchasing",
    icon: ShoppingCart,
    links: [
      { href: "/suppliers", label: "Suppliers", icon: Truck },
      { href: "/purchase-orders", label: "Purchase orders", icon: ClipboardList },
    ],
  },
  {
    label: "Finance",
    icon: Banknote,
    links: [
      { href: "/employees", label: "Employees", icon: UserCog },
      { href: "/payroll", label: "Payroll", icon: Banknote },
      { href: "/overheads", label: "Overheads", icon: Receipt },
      { href: "/expenses", label: "Expenses", icon: CreditCard },
      { href: "/break-even", label: "Break-even", icon: Scale },
      { href: "/quote-calculator", label: "Quote calculator", icon: Calculator },
      { href: "/cashflow", label: "Cashflow", icon: LineChart },
      { href: "/budget", label: "Budget vs actual", icon: PieChart },
    ],
  },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  {
    label: "Compliance",
    icon: ShieldCheck,
    links: [
      { href: "/forms", label: "Forms & certificates", icon: FileCheck },
      { href: "/assets", label: "Assets & recurring jobs", icon: Wrench },
    ],
  },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinkItem({ link, pathname, onNavigate }: { link: NavLink; pathname: string; onNavigate?: () => void }) {
  const active = isActive(pathname, link.href);
  const Icon = link.icon;
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {link.label}
    </Link>
  );
}

function SidebarContent({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {NAV.map((item, i) =>
        isGroup(item) ? (
          <div key={i}>
            <div className="mb-1 flex items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <item.icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              {item.label}
            </div>
            <div className="space-y-0.5">
              {item.links.map((link) => (
                <NavLinkItem key={link.href} link={link} pathname={pathname} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ) : (
          <div key={item.href} className="space-y-0.5">
            <NavLinkItem link={item} pathname={pathname} onNavigate={onNavigate} />
          </div>
        ),
      )}
    </nav>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-4 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">V</span>
      <span className="text-base font-semibold tracking-tight text-white">Voltline</span>
    </Link>
  );
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

const flatNavItems: (NavLink & { groupLabel?: string })[] = NAV.flatMap((item) =>
  isGroup(item) ? item.links.map((l) => ({ ...l, groupLabel: item.label })) : [item],
);

function CurrentPageBreadcrumb({ pathname }: { pathname: string }) {
  const current = flatNavItems.find((l) => isActive(pathname, l.href));
  if (!current) return <span className="text-sm font-medium text-slate-400">&nbsp;</span>;
  const Icon = current.icon;
  return (
    <div className="flex items-center gap-2 text-sm">
      {current.groupLabel && <span className="text-slate-400 dark:text-slate-500">{current.groupLabel}</span>}
      {current.groupLabel && <span className="text-slate-300 dark:text-slate-700">/</span>}
      <span className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
        <Icon className="h-4 w-4 text-slate-400" strokeWidth={2.25} />
        {current.label}
      </span>
    </div>
  );
}

export function AppShell({ businessName, children }: { businessName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        <Logo />
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between px-2 py-2">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="mr-2 rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 print:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <CurrentPageBreadcrumb pathname={pathname} />
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-500 dark:text-slate-400 sm:inline">{businessName}</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              {initials(businessName)}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
