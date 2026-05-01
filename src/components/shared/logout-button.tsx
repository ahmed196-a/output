"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { useQueryClient } from "@tanstack/react-query";

export function LogoutButton() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();

  const handleLogout = () => {
    clearSession();
    queryClient.clear();
    router.replace("/pricing");
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition"
      style={{ border: "1px solid #fecdd3", color: "#e11d48", background: "#fff1f2" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe4e6")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#fff1f2")}
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Sign out</span>
    </button>
  );
}
