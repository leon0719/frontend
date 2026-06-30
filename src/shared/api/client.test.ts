import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/shared/auth";
import { ApiError, apiGet, apiPost } from "./client";

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

const makeStorage = (): Storage => {
  let store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      store = {};
    },
    key: () => null,
    length: 0,
  } as Storage;
};

describe("api client", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeStorage());
    useAuthStore.setState({ user: null, token: null, status: "idle" });
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("performs a GET and returns parsed JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ id: 1 }));
    const data = await apiGet<{ id: number }>("/items/1");
    expect(data).toEqual({ id: 1 });
  });

  it("injects the Authorization header when a token exists", async () => {
    useAuthStore.setState({ token: "tok-123" });
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({}));
    await apiGet("/me");
    const init = spy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok-123");
  });

  it("omits Authorization when no token exists", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({}));
    await apiGet("/public");
    const init = spy.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBeNull();
  });

  it("sends a JSON body on POST", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockResolvedValue(ok({ ok: true }));
    await apiPost("/items", { name: "x" });
    const init = spy.mock.calls[0][1] as RequestInit;
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ name: "x" }));
  });

  it("throws ApiError with status and payload on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "nope" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(apiGet("/bad")).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      payload: { message: "nope" },
    });
    expect((await apiGet("/bad").catch((e) => e)) instanceof ApiError).toBe(true);
  });

  it("clears the auth session on 401", async () => {
    useAuthStore.setState({
      user: { id: "1", name: "admin", roles: ["admin"] },
      token: "tok",
      status: "authenticated",
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("{}", { status: 401, headers: { "Content-Type": "application/json" } }),
    );
    await expect(apiGet("/secure")).rejects.toBeInstanceOf(ApiError);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
