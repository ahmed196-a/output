"use client";

import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/shared/logout-button";
import { useAuthStore } from "@/store/auth-store";

type TopHeaderProps = { title: string };

export function TopHeader({ title }: TopHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <header
      className="sticky top-0 z-10 flex h-16 items-center justify-between px-4 lg:px-6"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(99,102,241,0.10)",
        boxShadow: "0 1px 0 rgba(99,102,241,0.06)"
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <button className="rounded-lg border p-2 text-slate-500 lg:hidden" style={{ borderColor: "var(--border)" }}>
          <Menu className="h-4 w-4" />
        </button>
        <h1
          className="text-base font-semibold"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "#1e1b4b" }}
        >
          {title}
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden md:flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {initials}
            </div>
            <span className="text-sm font-medium" style={{ color: "#374151" }}>
              {user.fullName ?? user.email}
            </span>
          </div>
        )}
        <LogoutButton />
      </div>
    </header>
  );
}
