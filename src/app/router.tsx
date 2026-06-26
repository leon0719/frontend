import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/home";

const rootRoute = createRootRoute({ component: Outlet });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
// TODO(Task 6): replace placeholder with DemoPage from @/pages/demo
const demoRoute = createRoute({ getParentRoute: () => rootRoute, path: "/demo", component: () => null });

const routeTree = rootRoute.addChildren([homeRoute, demoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
