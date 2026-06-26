import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { DemoPage } from "@/pages/demo";
import { HomePage } from "@/pages/home";
import { PlaygroundPage } from "@/pages/playground";

const rootRoute = createRootRoute({ component: Outlet });

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

const routeTree = rootRoute.addChildren([homeRoute, demoRoute, playgroundRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
