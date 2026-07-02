import { RouterProvider } from "@tanstack/react-router";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetAuthForTests, useAuthStore } from "@/shared/auth/model/auth-store";
import { router } from "./router";

const makeStorage = (): Storage => {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
};

describe("router", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", makeStorage());
    resetAuthForTests();
    useAuthStore.setState({ user: null, token: null, status: "idle" });
  });

  it("registers the login and admin routes", () => {
    const paths = Object.values(router.routesById).map((r) => r.fullPath);
    expect(paths).toContain("/login");
    expect(paths).toContain("/admin");
  });

  it("redirects an unauthenticated visitor from /admin to /login", async () => {
    render(<RouterProvider router={router} />);
    await router.navigate({ to: "/admin" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });

  it("lets a cold-loaded session reach /admin once restored from storage", async () => {
    // 模擬硬重新整理:localStorage 有 token,但 store 尚未 init
    localStorage.setItem("auth.token", "fake-token-admin");
    render(<RouterProvider router={router} />);
    await router.navigate({ to: "/admin" });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin");
    });
    expect(useAuthStore.getState().status).toBe("authenticated");
  });
});
