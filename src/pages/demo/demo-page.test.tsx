import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DemoPage } from "@/pages/demo";

afterEach(() => vi.restoreAllMocks());

function renderWithClient(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("DemoPage", () => {
  it("shows loading then the fetched repo name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ full_name: "facebook/react", stargazers_count: 1 }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    renderWithClient(<DemoPage />);
    expect(screen.getByText(/載入中/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/facebook\/react/)).toBeInTheDocument());
  });
});
