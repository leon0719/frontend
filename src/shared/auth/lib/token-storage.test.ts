import { beforeEach, describe, expect, it } from "vitest";
import { tokenStorage } from "./token-storage";

describe("tokenStorage", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when no token stored", () => {
    expect(tokenStorage.get()).toBeNull();
  });

  it("persists and reads a token", () => {
    tokenStorage.set("abc");
    expect(tokenStorage.get()).toBe("abc");
  });

  it("clears the token", () => {
    tokenStorage.set("abc");
    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
  });
});
