import "server-only";

import { normalizeApiOrigin } from "@/lib/api-origin";
import { readSessionToken } from "@/lib/session";

const API_ORIGIN = normalizeApiOrigin(
  process.env.INTERNAL_API_URL
    ?? process.env.NEXT_PUBLIC_API_URL
    ?? "http://127.0.0.1:8000",
);
const API_BASE_URL = `${API_ORIGIN}/api/`;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Server Component/API helper. Client Components should use the RTK Query feature hooks. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await readSessionToken();
  const normalizedPath = path.replace(/^\/+/, "");
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  const payload: unknown = response.status === 204
    ? undefined
    : await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "detail" in payload
      ? String(payload.detail)
      : `API request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
