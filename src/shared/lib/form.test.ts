import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useZodForm } from "./form";

const schema = z.object({ email: z.email() });

describe("useZodForm", () => {
  it("flags validation errors from the schema", async () => {
    const { result } = renderHook(() => useZodForm(schema, { defaultValues: { email: "nope" } }));
    await act(async () => {
      await result.current.handleSubmit(() => {})();
    });
    expect(result.current.formState.errors.email).toBeDefined();
  });

  it("passes validation for valid input", async () => {
    let submitted: { email: string } | null = null;
    const { result } = renderHook(() =>
      useZodForm(schema, { defaultValues: { email: "a@b.com" } }),
    );
    await act(async () => {
      await result.current.handleSubmit((values) => {
        submitted = values;
      })();
    });
    expect(submitted).toEqual({ email: "a@b.com" });
  });
});
