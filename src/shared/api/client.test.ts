import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiGet } from "@/shared/api";

afterEach(() => vi.restoreAllMocks());

describe("apiGet", () => {
  it("returns parsed json on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const data = await apiGet<{ ok: boolean }>("https://example.com/x");
    expect(data.ok).toBe(true);
  });

  it("throws ApiError with status on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 404 })));
    await expect(apiGet("https://example.com/x")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
    });
  });
});
