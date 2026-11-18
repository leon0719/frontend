import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Outlet: () => <div>outlet</div>,
  Link: ({ children }: { children: React.ReactNode }) => <a href="/">{children}</a>,
}));

import { fakeAuthAdapter, setAuthAdapter, useAuthStore } from "@/shared/auth";
import { AppLayout } from "./app-layout";
import { Toaster } from "./toast";

describe("AppLayout", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, status: "unauthenticated" });
  });

  it("renders the outlet", () => {
    render(<AppLayout />);
    expect(screen.getByText("outlet")).toBeInTheDocument();
  });

  it("always renders the language switcher", () => {
    render(<AppLayout />);
    expect(screen.getByRole("combobox", { name: /language/i })).toBeInTheDocument();
  });

  it("shows the user name and a logout button when authenticated", () => {
    useAuthStore.setState({
      user: { id: "1", name: "admin", roles: ["admin"] },
      status: "authenticated",
    });
    render(<AppLayout />);
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout|登出/i })).toBeInTheDocument();
  });

  it("hides the logout button when not authenticated", () => {
    render(<AppLayout />);
    expect(screen.queryByRole("button", { name: /logout|登出/i })).not.toBeInTheDocument();
  });

  describe("when logout fails", () => {
    const failure = new Error("network down");

    beforeEach(() => {
      setAuthAdapter({
        login: async () => {
          throw new Error("unused");
        },
        logout: async () => {
          throw failure;
        },
        me: async () => null,
      });
      useAuthStore.setState({
        user: { id: "1", name: "admin", roles: ["admin"] },
        status: "authenticated",
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
      setAuthAdapter(fakeAuthAdapter);
    });

    it("reports the error, shows a toast, and stays logged in", async () => {
      // reportError 預設走 console.error("[app-error]", error, context)
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      render(
        <>
          <AppLayout />
          <Toaster />
        </>,
      );
      await userEvent.click(screen.getByRole("button", { name: /logout|登出/i }));
      expect(await screen.findByText("登出失敗，請稍後再試")).toBeInTheDocument();
      expect(consoleError).toHaveBeenCalledWith("[app-error]", failure, { source: "logout" });
      expect(useAuthStore.getState().status).toBe("authenticated");
    });
  });
});
