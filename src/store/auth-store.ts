import { create } from "zustand";
import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";
import {
  PersistedAuthSession,
  clearAuthSession,
  getDefaultSessionExpiry,
  persistAuthSession,
  readPersistedAuthSession
} from "@/utils/auth-session";

type AuthState = {
  accessToken: string | null;
  user: User | null;
  tenant: Tenant | null;
  expiresAt: number | null;
  hydrated: boolean;
  setSession: (session: {
    accessToken: string;
    user: User;
    tenant?: Tenant;
    expiresAt?: number;
  }) => void;
  hydrateFromStorage: () => void;
  clearSession: () => void;
  isSessionExpired: () => boolean;
};

function toPersistedSession(state: AuthState): PersistedAuthSession | null {
  if (!state.accessToken || !state.user || !state.expiresAt) {
    return null;
  }
  return {
    accessToken: state.accessToken,
    user: state.user,
    tenant: state.tenant ?? undefined,
    expiresAt: state.expiresAt
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  tenant: null,
  expiresAt: null,
  hydrated: false,
  setSession: ({ accessToken, user, tenant, expiresAt }) => {
    const nextExpiresAt = expiresAt ?? getDefaultSessionExpiry();
    set({
      accessToken,
      user,
      tenant: tenant ?? null,
      expiresAt: nextExpiresAt,
      hydrated: true
    });
    const persisted = toPersistedSession(get());
    if (persisted) {
      persistAuthSession(persisted);
    }
  },
  hydrateFromStorage: () => {
    const session = readPersistedAuthSession();
    if (!session) {
      set({ hydrated: true });
      return;
    }
    set({
      accessToken: session.accessToken,
      user: session.user,
      tenant: session.tenant ?? null,
      expiresAt: session.expiresAt,
      hydrated: true
    });
  },
  clearSession: () => {
    clearAuthSession();
    set({
      accessToken: null,
      user: null,
      tenant: null,
      expiresAt: null,
      hydrated: true
    });
  },
  isSessionExpired: () => {
    const expiresAt = get().expiresAt;
    if (!expiresAt) {
      return true;
    }
    return Date.now() >= expiresAt;
  }
}));
