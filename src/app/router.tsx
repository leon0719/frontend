import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { AdminPage } from "@/pages/admin";
import { DemoPage } from "@/pages/demo";
import { HomePage } from "@/pages/home";
import { LoginPage } from "@/pages/login";
import { PlaygroundPage } from "@/pages/playground";
import { useAuthStore } from "@/shared/auth";
import { AppLayout } from "@/shared/ui";

const rootRoute = createRootRoute({ component: AppLayout });

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});
const demoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/demo",
  component: DemoPage,
});
const playgroundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/playground",
  component: PlaygroundPage,
});
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});
const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  beforeLoad: () => {
    if (useAuthStore.getState().status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  demoRoute,
  playgroundRoute,
  loginRoute,
  adminRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
