import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui";

export function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">React FSD Template</h1>
      <p className="mt-2 text-foreground/70">
        Vite + React 19 + TanStack + Tailwind，採 FSD pages-first 架構。
      </p>
      <div className="mt-6 flex gap-3">
        <Link to="/demo">
          <Button>前往 Demo 頁</Button>
        </Link>
        <Link to="/playground">
          <Button variant="outline">前往 Playground</Button>
        </Link>
      </div>
    </main>
  );
}
