const readEnv = (key: string, fallback: string) => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : fallback;
};

export const env = {
  apiBaseUrl: readEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:3000/api"),
  apiTimeoutMs: Number(readEnv("NEXT_PUBLIC_API_TIMEOUT_MS", "10000")),
  enableMockFallback: readEnv("NEXT_PUBLIC_ENABLE_MOCK_FALLBACK", "true") === "true",
  tenantHeaderKey: readEnv("NEXT_PUBLIC_TENANT_HEADER_KEY", "x-tenant-id"),
  tenantId: readEnv("NEXT_PUBLIC_TENANT_ID", "demo-tenant"),
  authTokenStorageKey: readEnv("NEXT_PUBLIC_AUTH_TOKEN_STORAGE_KEY", "access_token"),
  authCookieName: readEnv("NEXT_PUBLIC_AUTH_COOKIE_NAME", "voiceos_auth_token"),
  authSessionDurationHours: Number(readEnv("NEXT_PUBLIC_AUTH_SESSION_DURATION_HOURS", "8"))
};
