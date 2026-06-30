# CLAUDE.md

通用型 React 前端模板：Vite + React 19 + TS，FSD v2.1 pages-first，Biome 單一工具鏈。

## Commands
- `bun run dev` — 開發伺服器
- `bun run build` — 型別檢查 + 打包
- `bun run format` — Biome 格式化 + 修正 + 整理 import
- `bun run lint` — Biome 靜態檢查
- `bun run type-check` — `tsc --noEmit -p tsconfig.app.json`
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

## 平台底層（共用原件）

### Auth / 權限（`shared/auth`）
- `useAuth()` → `{ user, status, isAuthenticated, login, logout }`
- `usePermission()` → `{ hasRole(role), hasAnyRole(roles) }`（RBAC，角色為主）
- 守衛：`<RequireAuth>`（未登入導 `/login`）、`<RequireRole role>`（無角色顯示 403）
- 路由硬守衛：在 `createRoute` 用 `beforeLoad` 檢查 `useAuthStore.getState().status` 並 `throw redirect(...)`
- 換真後端：實作 `AuthAdapter`（`login/logout/me`）後呼叫 `setAuthAdapter(yourAdapter)`，store/guard/攔截器不動
- Token 持久化由 AuthAdapter 負責（login 時 persist、logout 時 clear、me 從持久化 token 還原 session）；store 僅在記憶體保存 `state.token`
- 假帳號（模板示範）：`admin/admin`（admin+user 角色）、`user/user`（user 角色）

> FSD 偏離說明：權限置於 `shared/auth` 而非 `entities/`，因為它同時被 `app`（router guard）與
> `shared/api`（攔截器）消費；放最底層才能讓「只能上層 import 下層」的鐵律成立。

> 已知限制：冷載入 / 硬重新整理 / 直接深連結到受保護路由（如 `/admin`）時，路由的同步
> `beforeLoad` 會在 `useAuthStore.init()`（於 mount useEffect 非同步執行）恢復 session
> 之前就執行，導致已登入使用者被踢回 `/login`，再次導航即可正常進入。此行為偏保守（不會
> 讓未驗證狀態通過），後續改善方向為讓 `beforeLoad` await 一個 session-ready promise。

### API client（`shared/api`）
- `apiGet/apiPost/apiPut/apiDelete<T>(path, body?, init?)`
- 自動從 auth-store 夾帶 `Authorization: Bearer <token>`
- 非 2xx 丟出 `ApiError`（`status` + `payload`）；401 會自動清除 session

### 其他原件
- `<ErrorBoundary>`（`shared/ui`）：包在 RouterProvider 外層接住 render 錯誤
- `<AppLayout>`（`shared/ui`）：header（登入者 + 登出）+ `<Outlet />`
- `useZodForm(schema, options?)`（`shared/lib/form`）：RHF + zod 薄封裝

### i18n（`shared/i18n`）
- 用法：`const { t } = useTranslation();` → `t("auth.login.title")`；切換語言用 `<LanguageSwitcher />` 或 `i18n.changeLanguage(code)`。
- 語言：`zh-TW`（預設 + fallback）、`en`；偵測 localStorage(`app.lang`) → navigator。
- 加語言：在 `SUPPORTED_LANGUAGES` 增一項，並新增 `locales/<code>.json`，於 `config.ts` 的 `resources` 註冊。
- 加 key：在 `locales/zh-TW.json` 新增（zh-TW 為型別來源，key 會自動有型別），再補其他語言。
- 型別安全：`i18next.d.ts` 以 zh-TW 詞庫宣告合併 `CustomTypeOptions`，未知 key 會編譯報錯。
- zod 訊息：schema 的 message 放 i18n key（如 `"auth.login.usernameRequired"`），畫面以 `t(errors.x.message)` 渲染。
- ErrorBoundary 特例：它位於 `I18nextProvider` 之外，故用全域 `i18n.t(...)` 而非 `useTranslation` hook。

## 開發方式
- **TDD**：每個原件先寫失敗測試（RED）→ 最小實作（GREEN）→ 重構（REFACTOR）。
- 新增 page 用 `scaffold-page` skill；變更後跑 `check` skill（Biome + tsc + Vitest）。
- 提交前確認 `bun run lint && bun run type-check && bun run test` 全綠。
- 設計與計畫文件置於 `docs/superpowers/`（已於 .gitignore 排除，屬本機輔助）。
