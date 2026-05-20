"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Settings, Receipt, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

const navItems = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/call-logs", label: "Call Logs",   icon: PhoneCall },
  { href: "/billing",   label: "Billing",     icon: Receipt },
  { href: "/settings",  label: "Settings",    icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto lg:flex shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)", minHeight: "100vh" }}
      >
        {/* Logo and Mobile Close */}
        <div className="flex h-16 items-center justify-between gap-2.5 px-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
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

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
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
                onClick={() => setSidebarOpen(false)} // Close sidebar on link click (mobile)
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
    </>
  );
}
