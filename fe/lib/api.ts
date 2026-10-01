/** Shared API boundary for the Django REST backend. Feature-specific requests belong in feature modules. */
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8000/api";

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

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    // Cookie-based session forwarding will be added with the auth implementation.
    credentials: "include",
  });

  const payload: unknown = response.status === 204 ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "detail" in payload
      ? String(payload.detail)
      : `API request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}
