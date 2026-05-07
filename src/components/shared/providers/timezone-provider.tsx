"use client";

import { useEffect } from "react";
import { useTimezoneStore } from "@/store/timezone-store";

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auto-detect user's timezone on client side only
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const locale = navigator.language;
    useTimezoneStore.setState({
      userTimezone: timezone,
      userLocale: locale,
    });
  }, []);

  return <>{children}</>;
}
