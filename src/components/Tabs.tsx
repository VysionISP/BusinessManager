"use client";

import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  FileCheck,
  GitBranch,
  History,
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Icon components can't cross the Server -> Client Component boundary as props,
// so tabs reference an icon by name and this client-only file resolves it.
const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  budget: Wallet,
  phases: GitBranch,
  variations: ClipboardList,
  purchaseOrders: ShoppingCart,
  invoicing: Receipt,
  forms: FileCheck,
  schedule: CalendarDays,
  audit: History,
};

export interface TabDef {
  id: string;
  label: string;
  icon?: keyof typeof ICONS;
  badge?: number;
}

export function TabPanel({ children }: { id: string; children: ReactNode }) {
  return <>{children}</>;
}

export function Tabs({ tabs, children, defaultTab }: { tabs: TabDef[]; children: ReactNode; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const panels = Children.toArray(children) as ReactElement<{ id: string; children: ReactNode }>[];
  const activePanel = panels.find((p) => isValidElement(p) && p.props.id === active);

  return (
    <div>
      <div className="scrollbar-none -mx-1 mb-5 flex gap-1 overflow-x-auto border-b border-slate-200 px-1 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon ? ICONS[tab.icon] : undefined;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" strokeWidth={2.25} />}
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none ${
                    isActive ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div>{activePanel}</div>
    </div>
  );
}
