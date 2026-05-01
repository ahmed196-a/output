"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bot,
  Building2,
  LayoutDashboard,
  LifeBuoy,
  PhoneCall,
  Radio,
  Receipt,
  Settings,
  BarChart2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminRole } from "@/hooks/admin/use-admin-role";
import { AdminNavPermission } from "@/types/admin/roles";

type AdminNavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission: AdminNavPermission;
  indent?: boolean;
};

const adminNavItems: AdminNavItem[] = [
  { href: "/admin/overview",       label: "Overview",        icon: LayoutDashboard, permission: "overview" },
  { href: "/admin/customers",      label: "Customers",       icon: Building2,       permission: "customers" },
  { href: "/admin/agents",         label: "Agents",          icon: Bot,             permission: "agents" },
  { href: "/admin/agents/analytics", label: "Analytics",    icon: BarChart2,       permission: "agents", indent: true },
  { href: "/admin/call-monitoring",label: "Call Monitoring", icon: PhoneCall,       permission: "call_monitoring" },
  { href: "/admin/recordings",     label: "Recordings",      icon: Radio,           permission: "recordings" },
  { href: "/admin/billing",        label: "Billing",         icon: Receipt,         permission: "billing" },
  { href: "/admin/operations",     label: "Operations",      icon: Activity,        permission: "operations" },
  { href: "/admin/support-tools",  label: "Support Tools",   icon: LifeBuoy,        permission: "support_tools" },
  { href: "/admin/settings",       label: "Settings",        icon: Settings,        permission: "settings" },
  { href: "/admin/users",          label: "Users",           icon: Users,           permission: "customers" as AdminNavPermission },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { hasPermission } = useAdminRole();

  return (
    <aside className="hidden w-72 border-r bg-white lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <p className="text-lg font-semibold">VoiceOS Admin</p>
      </div>
      <nav className="space-y-1 p-3">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  item.indent && "pl-9",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
      </nav>
    </aside>
  );
}
