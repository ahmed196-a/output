"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminRole } from "@/hooks/admin/use-admin-role";
import { AdminNavPermission } from "@/types/admin/roles";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission: AdminNavPermission;
};

const adminNavItems: AdminNavItem[] = [
  { href: "/admin/overview",       label: "Overview",       icon: LayoutDashboard, permission: "overview" },
  { href: "/admin/customers",      label: "Customers",      icon: Building2,       permission: "customers" },
  { href: "/admin/plans",          label: "Plans",          icon: Layers,          permission: "plans" },
  { href: "/admin/subscriptions",  label: "Subscriptions",  icon: CreditCard,      permission: "subscriptions" },
  { href: "/admin/billing",        label: "Billing",        icon: Receipt,         permission: "billing" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAdminRole();

  return (
    <aside className="hidden w-64 border-r bg-white lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <p className="text-lg font-semibold" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}>
          VoiceOS Admin
        </p>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {adminNavItems
          .filter((item) => hasPermission(item.permission))
          .map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}