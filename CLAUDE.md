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
