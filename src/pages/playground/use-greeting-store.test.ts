import { beforeEach, describe, expect, it } from "vitest";
import { useGreetingStore } from "./model/use-greeting-store";

describe("useGreetingStore", () => {
  beforeEach(() => {
    useGreetingStore.setState({ name: "" });
  });

  it("has an empty initial name", () => {
    const state = useGreetingStore.getState();
    expect(state.name).toBe("");
  });

  it("updates name via setName", () => {
    useGreetingStore.getState().setName("Ada");
    expect(useGreetingStore.getState().name).toBe("Ada");
  });
});
