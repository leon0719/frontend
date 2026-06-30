# Frontend Platform Template

通用型 React 前端平台模板：Vite + React 19 + TS，FSD v2.1（pages-first），Biome 單一工具鏈，
內建可複用的權限、API client 與跨切面原件，讓新專案以低成本快速啟動。

## 技術棧

React 19 · TypeScript · Vite · TanStack Router · TanStack Query · Zustand ·
React Hook Form · Zod · Tailwind CSS v4 · Vitest · Testing Library · Biome

## 快速開始

```bash
bun install
bun run dev
```

示範登入帳號：`admin/admin`（管理者，roles: admin+user）、`user/user`（一般使用者，role: user）。

## 指令

| 指令 | 說明 |
| --- | --- |
| `bun run dev` | 開發伺服器 |
| `bun run build` | 型別檢查 + 打包 |
| `bun run format` | Biome 格式化 + 修正 + 整理 import |
| `bun run lint` | Biome 靜態檢查 |
| `bun run type-check` | `tsc --noEmit` |
| `bun run test` | Vitest |

## 目錄結構（FSD）

```
src/
  app/      進入點、providers、router
  pages/    頁面 slice（ui / api / model）
  shared/   共用底層
    auth/   權限：store、adapter、hooks、guards
    api/    API client + 攔截器
    ui/     Button / Input / AppLayout / ErrorBoundary
    lib/    cn、useZodForm、query-client
    config/ env（zod 驗證）
```

分層鐵律與下沉時機見 `CLAUDE.md`。

> **FSD 偏離說明**：`shared/auth` 並非 `entities/`，因為它同時被 `app`（router guard）與
> `shared/api`（token 攔截器）消費；放最底層才能讓「只能上層 import 下層」的鐵律成立。

## 起一個新專案

1. 以本 repo 為模板建立新 repo。
2. 設定 `.env` 的 `VITE_API_BASE_URL`。
3. 實作專案的 `AuthAdapter` 並 `setAuthAdapter(...)`（見下節）。
4. 用 `scaffold-page` 加頁面，於 `src/app/router.tsx` 註冊路由。

## 接真實後端（取代 fake adapter）

```ts
import { type AuthAdapter, setAuthAdapter } from "@/shared/auth";
import { apiPost, apiGet } from "@/shared/api";

const realAdapter: AuthAdapter = {
  login: (c) => apiPost("/auth/login", c),
  logout: () => apiPost("/auth/logout"),
  me: () => apiGet("/auth/me").catch(() => null),
};
setAuthAdapter(realAdapter); // 在 app 啟動時呼叫一次
```

## 權限用法

```tsx
const { hasRole } = usePermission();
<RequireRole role="admin"> ... </RequireRole>
// 路由硬守衛：createRoute({ beforeLoad: () => { ... throw redirect({ to: "/login" }) } })
```

## 已知限制 / Known Limitations

冷載入 / 硬重新整理 / 直接深連結到受保護路由（如 `/admin`）時，路由的同步 `beforeLoad`
會在 `useAuthStore.init()`（於 mount useEffect 非同步執行）恢復 session 之前就執行，
導致已登入使用者被踢回 `/login`，再次導航即可正常進入。此行為偏保守（不讓未驗證狀態通過），
後續改善方向為讓 `beforeLoad` await 一個 session-ready promise。

## 開發規範

TDD（RED→GREEN→REFACTOR）；提交前 `bun run lint && bun run type-check && bun run test` 全綠。
