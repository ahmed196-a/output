import { create } from "zustand";

interface TimezoneStore {
  userLocale: string;
  userTimezone: string;
  setUserLocale: (locale: string) => void;
  setUserTimezone: (timezone: string) => void;
}

export const useTimezoneStore = create<TimezoneStore>((set) => ({
  userLocale: typeof navigator !== "undefined" ? navigator.language : "en-US",
  userTimezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC",
  setUserLocale: (locale) => set({ userLocale: locale }),
  setUserTimezone: (timezone) => set({ userTimezone: timezone }),
}));
