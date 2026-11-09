# CLAUDE.md

通用型 React 前端模板：Vite + React 19 + TS，FSD v2.1 pages-first，Biome 單一工具鏈。

## 回應語言

**一律使用繁體中文，採台灣本地化用語**——用 程式碼／資料／函式／物件／介面／型別／快取／預設／效能，
不用 代碼／數據／函數／對象／接口／類型／緩存／默認／性能。即使以英文提問，回應仍用繁體中文。
程式碼識別字、檔名、目錄名、套件名保持英文不翻譯。

## ⛔ 只能由人執行

不要自己執行——停下來，把完整指令交給使用者：
- 部署（上傳到 S3／CloudFront 或任何 prod 環境）、讀寫 prod 的 `.env`
- `git push`（任何分支）、force-push、改寫已推送的歷史
- 呼叫真實的第三方 API／webhook（含 Sentry 以外的上報端點）

## Commands
- `bun run dev` — 開發伺服器
- `bun run build` — 打包（route-level code splitting、hidden sourcemap、React Compiler）;型別檢查由 `type-check` 獨立負責（CI 與 pre-commit 都會跑）
- `bun run format` — Biome 格式化 + 修正 + 整理 import
- `bun run lint` — Biome 靜態檢查（`lint:ci` 為 CI 用的 lint+format 全檢）
- `bun run lint:fsd` — steiger 檢查 FSD 邊界（例外規則見 `steiger.config.ts`）
- `bun run type-check` — `tsc -b`（涵蓋 app + node 兩個 project）
- `bun run test` / `bun run test:watch` — Vitest
- `bun run gen:api` — 從後端 OpenAPI 產生 `src/shared/api/schema.d.ts`（`OPENAPI_URL` 指定來源，預設
  `http://localhost:8000/openapi.json`）。產物要 commit；Biome 不檢查它

CI（`.github/workflows/ci.yml`）跑 lint:ci + lint:fsd + type-check + test + build;
pre-commit hook（simple-git-hooks,`bun install` 時自動安裝）跑 lint + type-check。

## Architecture：FSD v2.1（pages-first）
分層（由上而下）：`app → pages → widgets → features → entities → shared`。
本模板只預鋪 `app / pages / shared` 三層；複雜度上升時才往下抽 `features / entities / widgets`。

### Import 規則（鐵律）
- 只能由上層 import 下層，**不可反向**。
- 同層 slice **不可**互相 import。
- 跨 slice 一律經由該 slice 的 `index.ts`（public API），**不可**深層 import 內部 segment。
- 一律用 `@/` 別名，不用相對路徑跳層。
- segment 分類：`ui`（元件）/ `model`（狀態邏輯，Zustand）/ `api`（Query hooks + 呼叫）/ `lib`（純函式）/ `config`。

> 工具強制：steiger（`bun run lint:fsd`,本機與 CI 皆跑）強制 public API 與分層規則;
> Biome `noRestrictedImports` 另擋 `@/app`。測試檔可深層 import(見 `steiger.config.ts`)。

## 何時下沉到 features / entities
- 同一段 UI/邏輯被 **2 個以上 page** 重複使用 → 抽到 `features` 或 `widgets`。
- 出現跨頁共享的「業務實體」型別與其 API（如 user、product）→ 抽到 `entities/<name>`。
- 在那之前，邏輯就留在 page slice 內，不要預先過度切分。

## 新增一個 page
1. `src/pages/<name>/ui/<name>-page.tsx` 放元件。
2. 資料抓取放 `src/pages/<name>/api/`（TanStack Query hook）。
3. `src/pages/<name>/index.ts` 只 re-export 對外要用的東西。
4. 在 `src/app/router.tsx` 用 `createRoute` 註冊路由,`component` 用
   `lazyRouteComponent(() => import("@/pages/<name>"), "<Name>Page")` 維持 code splitting。
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
- 路由硬守衛：在 `createRoute` 的 `beforeLoad` 先 `await initAuth()`（session-ready promise,
  冷載入/深連結會等 session 恢復完才判斷）,再檢查 `useAuthStore.getState().status` 並 `throw redirect(...)`
- 換真後端：實作 `AuthAdapter`（`login/logout/me`）後呼叫 `setAuthAdapter(yourAdapter)`，store/guard/攔截器不動
- Prod fail-fast：`import.meta.env.PROD` 下若 adapter 仍是 fakeAuthAdapter,`login/init` 直接 throw
- Token 持久化由 AuthAdapter 負責（login 時 persist、logout 時 clear、me 從持久化 token 還原 session）；store 僅在記憶體保存 `state.token`。`tokenStorage` 是 auth 內部實作,不在 public API
- 假帳號（模板示範,prod 會 fail-fast）：`admin/admin`（admin+user 角色）、`user/user`（user 角色）
- 安全注意:token 存 localStorage,任何 XSS 都可竊取;正式環境建議改由後端下發 httpOnly cookie,並自備 CSP / security headers（模板未內建）
- 前端守衛（beforeLoad / RequireRole）只是 UX,不是授權邊界;後端必須獨立驗權

> FSD 偏離說明：權限置於 `shared/auth` 而非 `entities/`，因為它同時被 `app`（router guard）與
> `shared/api`（攔截器）消費；放最底層才能讓「只能上層 import 下層」的鐵律成立。

### API client（`shared/api`）
- `apiGet/apiPost/apiPut/apiPatch/apiDelete<T>(path, body?, init?)`；部分更新用 `apiPatch`（後端更新端點是 PATCH）
- **後端契約 `BaseResponse`**（Django Ninja / FastAPI / .NET 模板相同）：成功 `{ data, error: null }`，
  失敗 `{ data: null, error: { code: <HTTP 狀態碼>, message, reason } }`。client 對自家 API 的回應**自動解包**
  `data`，所以 `T` 寫內層型別（`apiGet<Article>`，不是 `apiGet<BaseResponse<Article>>`）
- 錯誤分支用 `ApiError.reason`（穩定字串碼，如 `"username_taken"`，也可當 i18n key，如 `errors.<reason>`），
  **不要比對 `message`**——那是給開發者看的英文，文案會變
- 型別：有 `schema.d.ts` 時用 `components["schemas"]["XxxResponse"]`，不要手寫後端型別
- **只對 API origin**（`VITE_API_BASE_URL`,未設定時為頁面同源）夾帶 `Authorization: Bearer <token>`;
  絕對 URL 指向其他 host 時不附 token（防憑證外洩）
- 非 2xx 丟出 `ApiError`（`status` + `reason` + `message` + `payload`）；同源 401 會自動清除 session

### 錯誤處理（`shared/lib` + `shared/ui`）
- `reportError(error, context?)` / `setErrorReporter(fn)`:可插拔錯誤上報。接 Sentry 等服務時
  在啟動處呼叫一次 `setErrorReporter`;`main.tsx` 已掛 window `error` / `unhandledrejection`
- `<ErrorBoundary>`（`shared/ui`）：包在 RouterProvider 外層接住 render 錯誤,含重試按鈕,
  捕捉到的錯誤走 `reportError`
- build 產 `hidden` sourcemap（`dist/assets/*.map`,不對瀏覽器曝光,供錯誤追蹤服務上傳）

### 其他原件
- `<AppLayout>`（`shared/ui`）：header（登入者 + 登出）+ `<Outlet />`
- `useZodForm(schema, options?)`（`shared/lib`）：RHF + zod 薄封裝
- 404:`createRouter` 的 `defaultNotFoundComponent`;測試建 router 用 `createAppRouter({ history })`

### i18n（`shared/i18n`）
- 用法：`const { t } = useTranslation();` → `t("auth.login.title")`；切換語言用 `<LanguageSwitcher />` 或 `i18n.changeLanguage(code)`。
- 語言：`zh-TW`（預設 + fallback）、`en`；偵測 localStorage(`app.lang`) → navigator。
- 加語言：在 `SUPPORTED_LANGUAGES` 增一項，並新增 `locales/<code>.json`，於 `config.ts` 的 `resources` 註冊。
- 加 key：在 `locales/zh-TW.json` 新增（zh-TW 為型別來源，key 會自動有型別），再補其他語言。
- 型別安全：`i18next.d.ts` 以 zh-TW 詞庫宣告合併 `CustomTypeOptions`，未知 key 會編譯報錯。
- zod 訊息：schema 的 message 放 i18n key（如 `"auth.login.usernameRequired"`），畫面以 `t(errors.x.message)` 渲染。
- ErrorBoundary 特例：它位於 `I18nextProvider` 之外，故用全域 `i18n.t(...)` 而非 `useTranslation` hook。

## 前後端串接慣例

- **API 型別固定欄位**：Response / POST / PATCH 型別一律固定欄位，可空用 `| null`，**不用 `?`**；`?` 只用於查詢參數。
  可空判斷用 `=== null`。手寫的契約 interface 欄位加 JSDoc（對齊後端欄位說明）。
- **後端字串列舉用字面值聯集**：`type Status = "draft" | "published"`，值照抄後端，不用 TS `enum`。
- **時間一律 UTC 契約**：送出必帶時區位移（`toISOString()` 或 `+08:00`）；顯示前 `new Date(v)` 再格式化，
  **禁止** `slice(0, 10)` 截字串；只選日期的欄位，起始補 `00:00:00+08:00`、截止補 `23:59:59.999999+08:00`。
- **導頁用連結**：單純換頁用 `<Link>`，不用 `onClick` + `navigate`；需先驗證/確認/送 API 成功後才導頁才用 `navigate`。
- **路由命名**：path 用 kebab-case 複數名詞，ID 用路由參數（`/users/$userId`）而非 query string。
- **函式宣告**：頂層函式用 `function`；箭頭函式只用於參數或物件屬性值。

## 開發方式
- **TDD**：每個原件先寫失敗測試（RED）→ 最小實作（GREEN）→ 重構（REFACTOR）。
- 新增 page 用 `scaffold-page` skill；變更後跑 `check` skill（Biome + tsc + Vitest）。
- 提交前確認 `bun run lint && bun run type-check && bun run test` 全綠。
- 設計與計畫文件置於 `docs/superpowers/`（已於 .gitignore 排除，屬本機輔助）。

## Git

- Commit 格式 `<type>: <中文說明>`，type 只有 `feat`／`fix`／`docs`／`style`／`refactor`／`test`／`chore`。
  **說明用中文**、**不使用 scope**（不寫 `feat(auth):`）。
- 破壞性變更（呼叫端不改程式就會壞）在 type 後加 `!`：`feat!: 移除 apiPut`。
- 分支 `<類型>/<描述>`，類型只有 `feat`／`fix`／`refactor`／`docs`／`chore`；不直接 commit 到 `main`。
