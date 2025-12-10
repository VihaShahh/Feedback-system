import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError, csrfToken, json } from "../api";
beforeEach(() => {
  document.cookie = "feedback_csrf=test-token; path=/";
});
afterEach(() => {
  vi.unstubAllGlobals();
});
describe("credentialed API client", () => {
  it("adds a session-bound CSRF token only to mutations", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetcher);
    await api("/goals", { method: "POST", body: json({ title: "A goal" }) });
    const options = fetcher.mock.calls[0][1] as RequestInit;
    expect(options.credentials).toBe("include");
    expect(new Headers(options.headers).get("X-CSRF-Token")).toBe("test-token");
    expect(new Headers(options.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });
  it("reads an exact cookie name and permits equal signs in the token", () => {
    expect(
      csrfToken("other_feedback_csrf=wrong; feedback_csrf=correct%3D"),
    ).toBe("correct=");
  });
  it("does not attach a JSON content type to GET requests", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetcher);
    await api("/auth/me");
    const headers = new Headers(fetcher.mock.calls[0][1].headers);
    expect(headers.has("Content-Type")).toBe(false);
    expect(headers.has("X-CSRF-Token")).toBe(false);
  });
  it("preserves structured server errors without exposing server payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            error: {
              message: "Review this version",
              fields: [{ field: "version", message: "Stale" }],
              request_id: "request-id",
            },
          }),
          { status: 409 },
        ),
      ),
    );
    await expect(api("/feedback/id")).rejects.toMatchObject({
      status: 409,
      message: "Review this version",
      requestId: "request-id",
    });
  });
  it("expires the client session on a private 401 but keeps login errors local", async () => {
    const listener = vi.fn();
    window.addEventListener("session-expired", listener);
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve(new Response("{}", { status: 401 })),
        ),
    );
    await expect(api("/auth/login", { method: "POST" })).rejects.toBeInstanceOf(
      ApiError,
    );
    expect(listener).not.toHaveBeenCalled();
    await expect(api("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(listener).toHaveBeenCalledOnce();
    window.removeEventListener("session-expired", listener);
  });
  it("turns network failure into an actionable message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));
    await expect(api("/goals")).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining("connection"),
    });
  });
});
