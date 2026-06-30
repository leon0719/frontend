import { beforeEach, describe, expect, it } from "vitest";
import { fakeAuthAdapter } from "../adapter/fake-adapter";
import { setAuthAdapter, useAuthStore } from "./auth-store";

describe("useAuthStore", () => {
  beforeEach(() => {
    localStorage.clear();
    setAuthAdapter(fakeAuthAdapter);
    useAuthStore.setState({ user: null, token: null, status: "idle" });
  });

  it("starts unauthenticated by default", () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("logs in with valid credentials", async () => {
    await useAuthStore.getState().login({ username: "admin", password: "admin" });
    const s = useAuthStore.getState();
    expect(s.status).toBe("authenticated");
    expect(s.user?.roles).toContain("admin");
    expect(s.token).not.toBeNull();
  });

  it("rejects invalid credentials and stays unauthenticated", async () => {
    await expect(
      useAuthStore.getState().login({ username: "admin", password: "wrong" }),
    ).rejects.toThrow();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });

  it("logout clears user, token and storage", async () => {
    await useAuthStore.getState().login({ username: "user", password: "user" });
    await useAuthStore.getState().logout();
    const s = useAuthStore.getState();
    expect(s.user).toBeNull();
    expect(s.token).toBeNull();
    expect(localStorage.getItem("auth.token")).toBeNull();
  });

  it("clear() resets state synchronously without calling adapter", async () => {
    await useAuthStore.getState().login({ username: "user", password: "user" });
    useAuthStore.getState().clear();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(localStorage.getItem("auth.token")).toBeNull();
  });

  it("init() restores an existing session from a valid token", async () => {
    await useAuthStore.getState().login({ username: "admin", password: "admin" });
    useAuthStore.setState({ user: null, token: null, status: "idle" });
    await useAuthStore.getState().init();
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().user?.name).toBe("admin");
  });

  it("init() ends unauthenticated when no token exists", async () => {
    await useAuthStore.getState().init();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
  });
});
