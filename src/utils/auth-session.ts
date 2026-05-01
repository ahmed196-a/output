import { env } from "@/config/env";
import { Tenant } from "@/types/tenant";
import { User } from "@/types/user";

const SESSION_EXP_KEY = "auth_expires_at";
const USER_KEY = "auth_user";
const TENANT_KEY = "auth_tenant";

export type PersistedAuthSession = {
  accessToken: string;
  expiresAt: number;
  user: User;
  tenant?: Tenant;
};

export function persistAuthSession(session: PersistedAuthSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(env.authTokenStorageKey, session.accessToken);
  window.localStorage.setItem(SESSION_EXP_KEY, String(session.expiresAt));
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));

  if (session.tenant) {
    window.localStorage.setItem(TENANT_KEY, JSON.stringify(session.tenant));
  } else {
    window.localStorage.removeItem(TENANT_KEY);
  }

  const maxAgeSeconds = Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000));
  document.cookie = `${env.authCookieName}=1; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  if (session.user?.role) {
  document.cookie = `voiceos_user_role=${session.user.role}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(env.authTokenStorageKey);
  window.localStorage.removeItem(SESSION_EXP_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(TENANT_KEY);
  document.cookie = `${env.authCookieName}=; path=/; max-age=0; samesite=lax`;
  document.cookie = `voiceos_user_role=; path=/; max-age=0; samesite=lax`;
}

export function readPersistedAuthSession(): PersistedAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken = window.localStorage.getItem(env.authTokenStorageKey);
  const expiresAtRaw = window.localStorage.getItem(SESSION_EXP_KEY);
  const userRaw = window.localStorage.getItem(USER_KEY);
  const tenantRaw = window.localStorage.getItem(TENANT_KEY);

  if (!accessToken || !expiresAtRaw || !userRaw) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return null;
  }

  try {
    const user = JSON.parse(userRaw) as User;
    const tenant = tenantRaw ? (JSON.parse(tenantRaw) as Tenant) : undefined;
    return { accessToken, expiresAt, user, tenant };
  } catch {
    return null;
  }
}

export function getDefaultSessionExpiry() {
  return Date.now() + env.authSessionDurationHours * 60 * 60 * 1000;
}
