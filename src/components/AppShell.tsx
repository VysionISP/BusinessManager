"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  BarChart3,
  Boxes,
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
  LogOut,
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
import type { SessionUser } from "@/lib/auth";
import { USER_ROLE_LABELS, type UserRole } from "@/lib/types";
import { logout } from "@/lib/authActions";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[]; // omitted = every role can see it
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

const OFFICE_ONLY: UserRole[] = ["ADMIN", "OFFICE"];

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Sales",
    icon: Inbox,
    links: [
      { href: "/enquiries", label: "Enquiries", icon: Inbox, roles: OFFICE_ONLY },
      { href: "/customers", label: "Customers", icon: Users, roles: OFFICE_ONLY },
      { href: "/quotes", label: "Quotes", icon: FileText, roles: OFFICE_ONLY },
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
  { href: "/stock", label: "Stock", icon: Boxes },
  {
    label: "Purchasing",
    icon: ShoppingCart,
    links: [
      { href: "/suppliers", label: "Suppliers", icon: Truck, roles: OFFICE_ONLY },
      { href: "/purchase-orders", label: "Purchase orders", icon: ClipboardList, roles: OFFICE_ONLY },
    ],
  },
  {
    label: "Finance",
    icon: Banknote,
    links: [
      { href: "/employees", label: "Employees", icon: UserCog, roles: OFFICE_ONLY },
      { href: "/payroll", label: "Payroll", icon: Banknote, roles: OFFICE_ONLY },
      { href: "/overheads", label: "Overheads", icon: Receipt, roles: OFFICE_ONLY },
      { href: "/expenses", label: "Expenses", icon: CreditCard, roles: OFFICE_ONLY },
      { href: "/break-even", label: "Break-even", icon: Scale, roles: OFFICE_ONLY },
      { href: "/quote-calculator", label: "Quote calculator", icon: Calculator, roles: OFFICE_ONLY },
      { href: "/cashflow", label: "Cashflow", icon: LineChart, roles: OFFICE_ONLY },
      { href: "/budget", label: "Budget vs actual", icon: PieChart, roles: OFFICE_ONLY },
    ],
  },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: OFFICE_ONLY },
  {
    label: "Compliance",
    icon: ShieldCheck,
    links: [
      { href: "/forms", label: "Forms & certificates", icon: FileCheck },
      { href: "/assets", label: "Assets & recurring jobs", icon: Wrench },
    ],
  },
  { href: "/settings", label: "Settings", icon: SettingsIcon, roles: OFFICE_ONLY },
];

function visibleFor(role: UserRole) {
  const canSee = (link: NavLink) => !link.roles || link.roles.includes(role);
  return NAV.map((item) => (isGroup(item) ? { ...item, links: item.links.filter(canSee) } : item))
    .filter((item) => (isGroup(item) ? item.links.length > 0 : canSee(item)));
}

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
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-950/40"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
      {link.label}
    </Link>
  );
}

function SidebarContent({ pathname, role, onNavigate }: { pathname: string; role: UserRole; onNavigate?: () => void }) {
  const nav = visibleFor(role);
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {nav.map((item, i) =>
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
    <Link href="/" className="relative flex items-center gap-2.5 px-4 py-4">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-lg shadow-indigo-950/50">
        V
      </span>
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

export function AppShell({
  businessName,
  user,
  children,
}: {
  businessName: string;
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800/60 bg-slate-950 md:flex">
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          <Logo />
          <SidebarContent pathname={pathname} role={user.role} />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col overflow-hidden border-r border-slate-800/60 bg-slate-950">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
            <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center justify-between px-2 py-2">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="mr-2 rounded-md p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarContent pathname={pathname} role={user.role} onNavigate={() => setMobileOpen(false)} />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/90 print:hidden">
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
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-semibold text-white shadow-sm shadow-indigo-600/30">
                {initials(user.name)}
              </span>
              <div className="leading-tight">
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</div>
                <div className="text-xs text-slate-400">{USER_ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" strokeWidth={2.25} />
                <span className="hidden lg:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
