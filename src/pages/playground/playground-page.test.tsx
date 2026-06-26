import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PlaygroundPage } from "@/pages/playground";

function renderWithRouter(ui: React.ReactNode) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => <>{ui}</>,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("PlaygroundPage", () => {
  it("shows a validation error when name is too short", async () => {
    const user = userEvent.setup();
    renderWithRouter(<PlaygroundPage />);
    await waitFor(() => screen.getByRole("button", { name: /送出/i }));
    await user.type(screen.getByRole("textbox"), "A");
    await user.click(screen.getByRole("button", { name: /送出/i }));
    await waitFor(() => expect(screen.getByText(/至少 2 個字/)).toBeInTheDocument());
  });

  it("displays greeting after valid submission", async () => {
    const user = userEvent.setup();
    renderWithRouter(<PlaygroundPage />);
    await waitFor(() => screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Ada");
    await user.click(screen.getByRole("button", { name: /送出/i }));
    await waitFor(() => expect(screen.getByText(/Hello, Ada/)).toBeInTheDocument());
  });
});
