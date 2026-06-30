import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuthStore } from "@/shared/auth";
import { queryClient } from "@/shared/lib/query-client";
import { ErrorBoundary } from "@/shared/ui";
import { router } from "./router";

export function App() {
  useEffect(() => {
    useAuthStore.getState().init();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
