export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: { field: string; message: string }[] = [],
    public requestId?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function csrfToken(cookie = document.cookie) {
  const value = cookie
    .split("; ")
    .find((part) => part.startsWith("feedback_csrf="));
  return value ? decodeURIComponent(value.slice("feedback_csrf=".length)) : "";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method || "GET").toUpperCase();
  if (init.body) headers.set("Content-Type", "application/json");
  if (!["GET", "HEAD", "OPTIONS"].includes(method))
    headers.set("X-CSRF-Token", csrfToken());
  let response: Response;
  try {
    response = await fetch("/api/v1" + path, {
      ...init,
      method,
      headers,
      credentials: "include",
      signal: init.signal || AbortSignal.timeout(20000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "We could not reach the workspace. Check your connection and try again.",
      0,
    );
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    if (response.status === 401 && path !== "/auth/login")
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      payload?.error?.message || "Something went wrong. Please try again.",
      response.status,
      payload?.error?.fields || [],
      payload?.error?.request_id,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const json = (value: unknown) => JSON.stringify(value);
