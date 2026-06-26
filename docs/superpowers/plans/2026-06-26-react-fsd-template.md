# React FSD 通用模板 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把現有 Vite + React 19 + TS starter 改造成一個 production-ready、規範化的通用前端模板，採 FSD v2.1 pages-first 架構、Biome 單一工具鏈，並附 `.claude/skills`。

**Architecture:** FSD 只預鋪 `app / pages / shared` 三層，import 只能往下層流動，跨 slice 走 `index.ts` public API。資料抓取用 TanStack Query，路由用 TanStack Router（code-based），樣式用 Tailwind v4 + shadcn 風格元件。所有 format/lint/import 整理交給 Biome。

**Tech Stack:** Vite 8、React 19、TypeScript、TanStack Router、TanStack Query、Tailwind v4、React Hook Form + Zod、Zustand、Vitest + Testing Library、Biome、bun。

## Global Constraints

- 套件管理器一律 `bun`（lockfile 為 `bun.lockb`/`bun.lock`）。
- 路徑別名 `@/` → `src/`，所有跨 slice import 用別名，不用相對路徑跳層。
- Biome：`indentWidth 2`、`lineWidth 100`、double quotes、`organizeImports: on`、`noExplicitAny: warn`。
- FSD import 方向：`app → pages → widgets → features → entities → shared`，同層不互引，跨 slice 經 `index.ts`。
- 只用 Biome，**不**保留 oxlint / ESLint / Prettier。
- 測試只用 Vitest + Testing Library + jsdom，**無** Playwright / E2E。
- 不引入 Docker。
- 日期/版本：本計畫撰於 2026-06-26。

---

### Task 1: 工具鏈基礎（Biome、路徑別名、scripts、移除 oxlint）

**Files:**
- Create: `biome.json`
- Modify: `package.json`（scripts + deps，移除 oxlint）
- Delete: `.oxlintrc.json`
- Modify: `tsconfig.app.json`（加 `paths`）
- Modify: `vite.config.ts`（加 alias + vitest 設定）

**Interfaces:**
- Produces: `@/` 別名解析到 `src/`；bun scripts `dev / build / format / lint / type-check / test`。

- [ ] **Step 1: 安裝/移除依賴**

```bash
bun remove oxlint
bun add -d @biomejs/biome vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
bun add @tanstack/react-router @tanstack/react-query zustand react-hook-form zod @hookform/resolvers
bun add tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge lucide-react
rm -f .oxlintrc.json
```

- [ ] **Step 2: 建立 `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "vcs": { "enabled": false, "clientKind": "git", "useIgnoreFile": false },
  "files": { "ignoreUnknown": false, "includes": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.json"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "javascript": { "formatter": { "quoteStyle": "double" } },
  "assist": { "enabled": true, "actions": { "source": { "organizeImports": "on" } } },
  "css": { "parser": { "cssModules": false, "tailwindDirectives": true } },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "warn" },
      "nursery": {
        "noRestrictedImports": {
          "level": "error",
          "options": {
            "paths": {
              "@/app": "FSD: 不可從外部 import app 層（app 為最頂層，僅供進入點使用）"
            }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 3: 更新 `package.json` 的 scripts**

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "format": "biome check --write ./src",
  "lint": "biome lint ./src",
  "type-check": "tsc --noEmit -p tsconfig.app.json",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: `tsconfig.app.json` 加入路徑別名**

在 `compilerOptions` 內加入（與既有設定並存）：

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

- [ ] **Step 5: 改寫 `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
```

- [ ] **Step 6: 建立 `src/test/setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 7: 驗證工具鏈**

Run: `bun run lint && bun run type-check`
Expected: 兩者皆 PASS（type-check 可能因尚未改 App.tsx 而通過；若有殘留 import 錯誤，於後續任務修正）。

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: switch tooling to biome, add @ alias and vitest config"
```

---

### Task 2: 共用樣式與 shared/ui Button

**Files:**
- Create: `src/index.css`（覆寫既有）
- Create: `src/shared/lib/cn.ts`
- Create: `src/shared/ui/button.tsx`
- Create: `src/shared/ui/index.ts`
- Test: `src/shared/ui/button.test.tsx`
- Delete: `src/App.css`

**Interfaces:**
- Produces: `cn(...inputs)` 合併 className；`<Button variant size>` 元件；`@/shared/ui` 匯出 `Button`。

- [ ] **Step 1: 寫失敗測試 `src/shared/ui/button.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/ui";

describe("Button", () => {
  it("renders its children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
  });

  it("applies the destructive variant class", () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole("button")).toHaveClass("bg-destructive");
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `bun run test -- src/shared/ui/button.test.tsx`
Expected: FAIL（找不到 `@/shared/ui`）。

- [ ] **Step 3: 建立 `src/shared/lib/cn.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: 覆寫 `src/index.css`（Tailwind v4 + 設計 token）**

```css
@import "tailwindcss";

@theme {
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-primary: #18181b;
  --color-primary-foreground: #fafafa;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #fafafa;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

- [ ] **Step 5: 建立 `src/shared/ui/button.tsx`**

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:opacity-90",
        destructive: "bg-destructive text-destructive-foreground hover:opacity-90",
        outline: "border border-foreground/20 bg-background hover:bg-foreground/5",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

- [ ] **Step 6: 建立 `src/shared/ui/index.ts`**

```ts
export { Button, type ButtonProps } from "./button";
```

- [ ] **Step 7: 移除舊 `App.css`**

```bash
rm -f src/App.css
```

- [ ] **Step 8: 跑測試確認通過**

Run: `bun run test -- src/shared/ui/button.test.tsx`
Expected: PASS（2 個測試）。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(shared): add tailwind theme, cn helper and Button ui"
```

---

### Task 3: shared/config 環境變數（Zod 驗證）

**Files:**
- Create: `src/shared/config/env.ts`
- Create: `src/shared/config/index.ts`
- Create: `.env.example`
- Test: `src/shared/config/env.test.ts`

**Interfaces:**
- Consumes: `zod`。
- Produces: `env` 物件，含 `apiBaseUrl: string`、`mode: string`、`isDev: boolean`；由 `@/shared/config` 匯出。

- [ ] **Step 1: 寫失敗測試 `src/shared/config/env.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { env } from "@/shared/config";

describe("env", () => {
  it("exposes a string apiBaseUrl", () => {
    expect(typeof env.apiBaseUrl).toBe("string");
  });

  it("exposes mode flags", () => {
    expect(typeof env.isDev).toBe("boolean");
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `bun run test -- src/shared/config/env.test.ts`
Expected: FAIL（找不到 `@/shared/config`）。

- [ ] **Step 3: 建立 `src/shared/config/env.ts`**

```ts
import { z } from "zod";

const schema = z.object({
  VITE_API_BASE_URL: z.string().url().or(z.literal("")).default(""),
});

const parsed = schema.parse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL ?? "",
});

export const env = {
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  mode: import.meta.env.MODE,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
```

- [ ] **Step 4: 建立 `src/shared/config/index.ts`**

```ts
export { env } from "./env";
```

- [ ] **Step 5: 建立 `.env.example`**

```bash
# API base URL（留空則 demo 頁直接打絕對網址）
VITE_API_BASE_URL=
```

- [ ] **Step 6: 跑測試確認通過**

Run: `bun run test -- src/shared/config/env.test.ts`
Expected: PASS（2 個測試）。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(shared): add zod-validated env config"
```

---

### Task 4: shared/api fetch client

**Files:**
- Create: `src/shared/api/client.ts`
- Create: `src/shared/api/index.ts`
- Test: `src/shared/api/client.test.ts`

**Interfaces:**
- Consumes: `env.apiBaseUrl`（來自 Task 3 的 `@/shared/config`）。
- Produces: `apiGet<T>(path: string): Promise<T>` 與 `ApiError`（含 `status: number`）；由 `@/shared/api` 匯出。

- [ ] **Step 1: 寫失敗測試 `src/shared/api/client.test.ts`**

```ts
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
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `bun run test -- src/shared/api/client.test.ts`
Expected: FAIL（找不到 `@/shared/api`）。

- [ ] **Step 3: 建立 `src/shared/api/client.ts`**

```ts
import { env } from "@/shared/config";

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function resolveUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${env.apiBaseUrl}${path}`;
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(resolveUrl(path), {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new ApiError(res.status, `GET ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}
```

- [ ] **Step 4: 建立 `src/shared/api/index.ts`**

```ts
export { apiGet, ApiError } from "./client";
```

- [ ] **Step 5: 跑測試確認通過**

Run: `bun run test -- src/shared/api/client.test.ts`
Expected: PASS（2 個測試）。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(shared): add fetch api client with ApiError"
```

---

### Task 5: app 層 — providers、router、pages/home

**Files:**
- Create: `src/shared/lib/query-client.ts`
- Create: `src/pages/home/ui/home-page.tsx`
- Create: `src/pages/home/index.ts`
- Create: `src/app/router.tsx`
- Create: `src/app/providers.tsx`
- Create: `src/app/index.tsx`
- Modify: `src/main.tsx`
- Delete: `src/App.tsx`
- Test: `src/pages/home/home-page.test.tsx`

**Interfaces:**
- Consumes: `Button`（`@/shared/ui`）。
- Produces: `queryClient`（`@/shared/lib/query-client`）；`router`（`@/app/router`）；`HomePage`（`@/pages/home`）；`<App />`（`@/app`）。路由 `/` → HomePage、`/demo` → DemoPage（Task 6 填入，先以佔位 lazy import 預留）。

- [ ] **Step 1: 寫失敗測試 `src/pages/home/home-page.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomePage } from "@/pages/home";

describe("HomePage", () => {
  it("renders the template heading", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /React FSD Template/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `bun run test -- src/pages/home/home-page.test.tsx`
Expected: FAIL（找不到 `@/pages/home`）。

- [ ] **Step 3: 建立 `src/shared/lib/query-client.ts`**

```ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
```

- [ ] **Step 4: 建立 `src/pages/home/ui/home-page.tsx`**

```tsx
import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/ui";

export function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">React FSD Template</h1>
      <p className="mt-2 text-foreground/70">
        Vite + React 19 + TanStack + Tailwind，採 FSD pages-first 架構。
      </p>
      <Link to="/demo" className="mt-6 inline-block">
        <Button>前往 Demo 頁</Button>
      </Link>
    </main>
  );
}
```

- [ ] **Step 5: 建立 `src/pages/home/index.ts`**

```ts
export { HomePage } from "./ui/home-page";
```

- [ ] **Step 6: 建立 `src/app/router.tsx`**

```tsx
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { HomePage } from "@/pages/home";
import { DemoPage } from "@/pages/demo";

const rootRoute = createRootRoute({ component: Outlet });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: HomePage });
const demoRoute = createRoute({ getParentRoute: () => rootRoute, path: "/demo", component: DemoPage });

const routeTree = rootRoute.addChildren([homeRoute, demoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

> 註：此檔 import `@/pages/demo`，由 Task 6 建立。若先行執行本任務，暫時把 `demoRoute` 的 `component` 換成一個 inline `() => null` 並移除 demo import，待 Task 6 補回。建議與 Task 6 連續執行。

- [ ] **Step 7: 建立 `src/app/providers.tsx`**

```tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { queryClient } from "@/shared/lib/query-client";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 8: 建立 `src/app/index.tsx`**

```tsx
export { App } from "./providers";
```

- [ ] **Step 9: 改寫 `src/main.tsx`，刪除 `src/App.tsx`**

`src/main.tsx`：

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

```bash
rm -f src/App.tsx
```

- [ ] **Step 10: 跑測試確認通過**

Run: `bun run test -- src/pages/home/home-page.test.tsx`
Expected: PASS（1 個測試）。

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(app): wire query client, router and home page"
```

---

### Task 6: pages/demo — TanStack Query 資料抓取範例

**Files:**
- Create: `src/pages/demo/api/use-repo.ts`
- Create: `src/pages/demo/ui/demo-page.tsx`
- Create: `src/pages/demo/index.ts`
- Test: `src/pages/demo/demo-page.test.tsx`

**Interfaces:**
- Consumes: `apiGet`（`@/shared/api`）、`@tanstack/react-query`。
- Produces: `useRepo()` query hook；`DemoPage`（`@/pages/demo`，供 Task 5 的 router 使用）。

- [ ] **Step 1: 寫失敗測試 `src/pages/demo/demo-page.test.tsx`**

```tsx
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
```

- [ ] **Step 2: 跑測試確認失敗**

Run: `bun run test -- src/pages/demo/demo-page.test.tsx`
Expected: FAIL（找不到 `@/pages/demo`）。

- [ ] **Step 3: 建立 `src/pages/demo/api/use-repo.ts`**

```ts
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/shared/api";

export interface Repo {
  full_name: string;
  stargazers_count: number;
}

export function useRepo() {
  return useQuery({
    queryKey: ["repo", "facebook/react"],
    queryFn: () => apiGet<Repo>("https://api.github.com/repos/facebook/react"),
  });
}
```

- [ ] **Step 4: 建立 `src/pages/demo/ui/demo-page.tsx`**

```tsx
import { useRepo } from "@/pages/demo/api/use-repo";

export function DemoPage() {
  const { data, isPending, isError } = useRepo();

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">Demo：TanStack Query</h1>
      {isPending && <p className="mt-4">載入中…</p>}
      {isError && <p className="mt-4 text-destructive">載入失敗</p>}
      {data && (
        <p className="mt-4">
          {data.full_name} ⭐ {data.stargazers_count}
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 5: 建立 `src/pages/demo/index.ts`**

```ts
export { DemoPage } from "./ui/demo-page";
```

- [ ] **Step 6: 確認 `src/app/router.tsx` 已正確 import `DemoPage`**

若 Task 5 用了佔位，現在把 `demoRoute` 還原為 `component: DemoPage` 並補回 `import { DemoPage } from "@/pages/demo";`。

- [ ] **Step 7: 跑測試確認通過**

Run: `bun run test -- src/pages/demo/demo-page.test.tsx`
Expected: PASS（1 個測試）。

- [ ] **Step 8: 跑全套驗收**

Run: `bun run lint && bun run type-check && bun run test`
Expected: 全部 PASS。

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(pages): add demo page with tanstack query data fetching"
```

---

### Task 7: 文件 — CLAUDE.md 與 README.md

**Files:**
- Create: `CLAUDE.md`
- Modify: `README.md`（覆寫）

**Interfaces:**
- 無程式碼介面；文件需與前述任務的路徑、scripts、別名一致。

- [ ] **Step 1: 建立 `CLAUDE.md`**

````markdown
# CLAUDE.md

通用型 React 前端模板：Vite + React 19 + TS，FSD v2.1 pages-first，Biome 單一工具鏈。

## Commands
- `bun run dev` — 開發伺服器
- `bun run build` — 型別檢查 + 打包
- `bun run format` — Biome 格式化 + 修正 + 整理 import
- `bun run lint` — Biome 靜態檢查
- `bun run type-check` — `tsc --noEmit`
- `bun run test` / `bun run test:watch` — Vitest

## Architecture：FSD v2.1（pages-first）
分層（由上而下）：`app → pages → widgets → features → entities → shared`。
本模板只預鋪 `app / pages / shared` 三層；複雜度上升時才往下抽 `features / entities / widgets`。

### Import 規則（鐵律）
- 只能由上層 import 下層，**不可反向**。
- 同層 slice **不可**互相 import。
- 跨 slice 一律經由該 slice 的 `index.ts`（public API），**不可**深層 import 內部 segment。
- 一律用 `@/` 別名，不用相對路徑跳層。
- segment 分類：`ui`（元件）/ `model`（狀態邏輯，Zustand）/ `api`（Query hooks + 呼叫）/ `lib`（純函式）/ `config`。

> Biome 只能部分強制（`noRestrictedImports`），其餘靠本文件與 `scaffold-page` skill 維持。

## 何時下沉到 features / entities
- 同一段 UI/邏輯被 **2 個以上 page** 重複使用 → 抽到 `features` 或 `widgets`。
- 出現跨頁共享的「業務實體」型別與其 API（如 user、product）→ 抽到 `entities/<name>`。
- 在那之前，邏輯就留在 page slice 內，不要預先過度切分。

## 新增一個 page
1. `src/pages/<name>/ui/<name>-page.tsx` 放元件。
2. 資料抓取放 `src/pages/<name>/api/`（TanStack Query hook）。
3. `src/pages/<name>/index.ts` 只 re-export 對外要用的東西。
4. 在 `src/app/router.tsx` 用 `createRoute` 註冊路由。
5. 加測試 `src/pages/<name>/<name>-page.test.tsx`。
（可直接用 `scaffold-page` skill 產生骨架。）

## Code Style
- Biome：indentWidth 2、lineWidth 100、double quotes、organizeImports。
- `noExplicitAny: warn` — 避免 `any`。
- 提交前跑 `check` skill 或 `bun run lint && bun run type-check && bun run test`。
````

- [ ] **Step 2: 覆寫 `README.md`**

````markdown
# React FSD Template

Production-ready React 前端模板：Vite + React 19 + TypeScript，採 Feature-Sliced Design
(pages-first) 架構，Biome 單一工具鏈。

## Stack
| 面向 | 技術 |
| --- | --- |
| 建置 | Vite 8 + React 19 + TS |
| 路由 | TanStack Router |
| 伺服器資料 | TanStack Query |
| 樣式 | Tailwind v4 + shadcn 風格元件 |
| 表單 | React Hook Form + Zod |
| 狀態 | Zustand |
| 測試 | Vitest + Testing Library |
| Lint/Format | Biome |

## Quick Start
```bash
cp .env.example .env.local   # 視需要填 VITE_API_BASE_URL
bun install
bun run dev                  # http://localhost:5173
```

## Scripts
`dev` · `build` · `format` · `lint` · `type-check` · `test` · `test:watch`

## 架構
見 `CLAUDE.md`。簡述：FSD 分層 `app / pages / shared`（pages-first，需要時再下沉），
import 只能往下層、跨 slice 走 `index.ts` public API、一律用 `@/` 別名。

## 目錄
```
src/
├── app/      進入點、providers、router
├── pages/    路由級頁面（home、demo）
├── shared/   api client、config、ui、lib
└── test/     vitest setup
```
````

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add CLAUDE.md conventions and rewrite README"
```

---

### Task 8: `.claude/skills` — scaffold-page 與 check

**Files:**
- Create: `.claude/skills/scaffold-page/SKILL.md`
- Create: `.claude/skills/check/SKILL.md`

**Interfaces:**
- 無程式碼介面；skill 指令需與實際 scripts 與路徑一致。

- [ ] **Step 1: 建立 `.claude/skills/check/SKILL.md`**

````markdown
---
name: check
description: Run the full local quality gate for this template — Biome check, tsc type-check, and Vitest — and summarize results. Use when the user asks to "run checks", "check the code", "品質檢查", "跑測試", or before committing.
---

# Quality gate

依序執行，回報精簡 pass/fail。遇到第一個硬失敗就停下並貼出輸出。

```bash
bun run format        # Biome 格式化 + lint 修正 + 整理 import
bun run type-check    # tsc --noEmit
bun run test          # Vitest run
```

## Report format
彙整成：`biome: OK · type-check: OK · test: N passed`。任何失敗則貼出相關行並提出修正。
````

- [ ] **Step 2: 建立 `.claude/skills/scaffold-page/SKILL.md`**

````markdown
---
name: scaffold-page
description: Scaffold a new FSD page slice (pages/<name>) with ui + api segments, public index.ts, a route registration, and a test. Use when the user asks to "add a page", "new page", "新增頁面", "scaffold a page".
---

# Scaffold a page slice

依 FSD pages-first 慣例新增一個 page。向使用者確認 `<name>`（kebab-case）後：

1. 建 `src/pages/<name>/ui/<name>-page.tsx`：

```tsx
export function <Pascal>Page() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold"><Pascal></h1>
    </main>
  );
}
```

2. 若需資料抓取，建 `src/pages/<name>/api/use-<name>.ts`（TanStack Query hook，
   透過 `@/shared/api` 的 `apiGet` 呼叫）。

3. 建 `src/pages/<name>/index.ts`：

```ts
export { <Pascal>Page } from "./ui/<name>-page";
```

4. 在 `src/app/router.tsx` 註冊：

```tsx
import { <Pascal>Page } from "@/pages/<name>";
const <camel>Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/<name>",
  component: <Pascal>Page,
});
// 並把 <camel>Route 加進 rootRoute.addChildren([...])
```

5. 建測試 `src/pages/<name>/<name>-page.test.tsx`，至少驗證標題 render。

## 鐵律
- import 只能往下層；跨 slice 走 `index.ts`；一律用 `@/` 別名。
- 完成後跑 `check` skill 驗收。
````

- [ ] **Step 3: 驗證 skills 結構**

Run: `ls .claude/skills/scaffold-page/SKILL.md .claude/skills/check/SKILL.md`
Expected: 兩個檔案都存在。

- [ ] **Step 4: 最終全套驗收**

Run: `bun run lint && bun run type-check && bun run test`
Expected: 全部 PASS。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: add scaffold-page and check claude skills"
```

---

## 完成標準

- `bun run dev` 可開到 `/`（home）與 `/demo`（TanStack Query 抓 GitHub repo）。
- `bun run lint && bun run type-check && bun run test` 全綠。
- FSD 三層結構就位，`CLAUDE.md` 載明 import 規則與下沉時機。
- `.claude/skills` 內 `scaffold-page` 與 `check` 可用。
