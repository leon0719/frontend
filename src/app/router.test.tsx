import { describe, expect, it } from "vitest";
import { router } from "./router";

describe("router", () => {
  it("registers the login and admin routes", () => {
    const paths = Object.values(router.routesById).map((r) => r.fullPath);
    expect(paths).toContain("/login");
    expect(paths).toContain("/admin");
  });

  it("guards the admin route with beforeLoad", () => {
    const adminRoute = Object.values(router.routesById).find((r) => r.fullPath === "/admin");
    expect(adminRoute?.options.beforeLoad).toBeTypeOf("function");
  });
});
