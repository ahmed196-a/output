import { env } from "@/config/env";
import { ApiEnvelope, ApiError } from "@/types/api";

function isFallbackEligible(error: unknown): boolean {
  if (!(error instanceof ApiError)) {
    return false;
  }

  const status = error.status;
  if (!status) {
    return true;
  }

  return status === 404 || status >= 500;
}

export async function requestWithFallback<T>({
  request,
  fallback
}: {
  request: () => Promise<T | ApiEnvelope<T>>;
  fallback: () => T;
}): Promise<T> {
  try {
    const result = await request();
    if (typeof result === "object" && result !== null && "data" in result) {
      return (result as ApiEnvelope<T>).data;
    }
    return result as T;
  } catch (error) {
    if (env.enableMockFallback && isFallbackEligible(error)) {
      return fallback();
    }
    throw error;
  }
}
