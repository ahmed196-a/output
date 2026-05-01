"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Settings, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/call-logs", label: "Call Logs",   icon: PhoneCall },
  { href: "/billing",   label: "Billing",     icon: Receipt },
  { href: "/settings",  label: "Settings",    icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden w-64 lg:flex flex-col"
      style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)", minHeight: "100vh" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-white/10">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          V
        </div>
        <span
          className="text-base font-semibold text-white tracking-tight"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          VoiceOS
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(199,210,254,0.45)" }}>
          Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "text-white shadow-md"
                  : "hover:bg-white/10"
              )}
              style={active
                ? { background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff" }
                : { color: "rgba(199,210,254,0.8)" }
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer brand */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs" style={{ color: "rgba(199,210,254,0.4)" }}>
          Powered by{" "}
          <span className="font-semibold" style={{ color: "rgba(199,210,254,0.7)" }}>
            CallAutomate
          </span>
        </p>
      </div>
    </aside>
  );
}
