"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

const protectedPrefixes = ["/dashboard", "/agents", "/call-logs", "/recordings", "/billing", "/settings", "/admin"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrateFromStorage = useAuthStore((state) => state.hydrateFromStorage);
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (accessToken && isSessionExpired()) {
      clearSession();
      router.replace("/auth/login?reason=session_expired");
      return;
    }

    if (!accessToken && isProtectedPath(pathname)) {
      router.replace("/auth/login");
    }
  }, [accessToken, clearSession, hydrated, isSessionExpired, pathname, router]);

  return <>{children}</>;
}
