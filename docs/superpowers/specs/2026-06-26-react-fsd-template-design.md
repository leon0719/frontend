# 通用型 React 前端模板設計（Vite + FSD pages-first）

> 對標 `django-ninja-project-tree` 的「production-ready 規範化模板」精神，
> 用最小維護成本套用到前端。

## 目標

提供一個可重複使用的 React 前端起手式模板，特色是：

- **定死選型**，使用者不必每次重新決策。
- **強制分層規範**（FSD），且規範可被 lint 自動驗證。
- **附 `.claude/skills`**，讓 Claude Code 能依慣例 scaffold 與驗收。
- **刻意極簡**，優先維護性，不過度切分。

非目標：SSR/RSC、E2E、Docker、全域狀態的重度示範。

## 技術棧（定死）

| 面向 | 選用 |
| --- | --- |
| 建置 | Vite 8 + React 19 + TypeScript |
| 路由 | TanStack Router（type-safe） |
| 伺服器資料 | TanStack Query |
| 樣式 / UI | Tailwind + shadcn/ui |
| 表單 | React Hook Form + Zod |
| HTTP | 封裝過的 fetch client（無 axios） |
| 全域狀態 | Zustand（放 `shared`，不強推） |
| 測試 | Vitest + Testing Library + jsdom（**無 E2E**） |
| Lint / Format | **Biome 單一工具**（format + lint + organizeImports，移除 oxlint） |
| 套件管理 | bun |

> 參考 `vue_project/smart-listing-frontend-vue` 的 `biome.json` 與 scripts 慣例：
> formatter `lineWidth 100`、`indentWidth 2`、double quotes、`organizeImports: on`、
> `noExplicitAny: warn`。scripts 命名沿用 `dev / build / format / lint / type-check / test`。

## 架構：FSD v2.1 pages-first

只預先鋪三層，其餘層級需要時再下沉。

```
src/
├── app/        # 進入點、providers（Query/Router）、路由樹、全域樣式
├── pages/      # 路由級頁面（主要工作區）
│   ├── home/
│   └── demo/   # 示範 TanStack Query 抓公開 API
├── shared/     # 跨頁共用基礎建設
│   ├── api/    # 封裝 fetch client
│   ├── config/ # 環境變數（型別安全）
│   ├── ui/     # shadcn 元件（示範 button）
│   └── lib/    # query client、工具函式
└── (features / entities / widgets 先不建，README 說明何時下沉)
```

### FSD import 規則

- 引用只能由上層 → 下層：`app → pages → widgets → features → entities → shared`。
- 同層 slice 不得互相引用。
- 跨 slice 一律經由該 slice 的 `index.ts`（public API），不得深層 import 內部 segment。
- segment 分類：`ui / model / api / lib / config`。

**強制方式**：Biome 無 FSD 專用 boundaries plugin，因此採兩段式：
1. Biome `noRestrictedImports` 設定 import path 模式，擋掉最常見的反向/深層 import。
2. 其餘規則寫進 `CLAUDE.md`，由 `scaffold-page` skill 與 code review 維持。

## 範例內容（極簡）

1. `pages/home` — 靜態首頁，示範 shadcn `Button` 與 Tailwind。
2. `pages/demo` — 用 TanStack Query 打一支公開 API（例如 `https://api.github.com/...`），
   示範 loading / error / data 狀態與 `shared/api` client 用法。
3. `shared/api/client.ts` — 封裝 fetch：base URL、JSON 解析、錯誤轉換。
4. `shared/config/env.ts` — 用 Zod 驗證 `import.meta.env`。

## 規範與工具

- `CLAUDE.md` — FSD 分層規則、import 方向、segment 慣例、新增 page 的步驟。
- `README.md` — 快速開始、指令表、架構說明。
- `.env.example` — 環境變數範本。
- `biome.json` — 對齊參考專案慣例（lineWidth 100、indentWidth 2、double quotes、organizeImports、noExplicitAny warn、`noRestrictedImports` 設 FSD 規則）。
- bun scripts：`dev / build / format / lint / type-check / test`。

## `.claude/skills`

- **scaffold-page** — 產生新的 page slice（`pages/<name>/{ui,index.ts}` + 註冊路由）。
- **check** — 跑完整本地驗收：`biome check` + `tsc --noEmit` + `vitest run`。

## 測試策略

- Vitest + Testing Library + jsdom。
- 至少一支 `pages/demo` 的元件測試（mock fetch，驗證 loading→data 流程）。
- 無 Playwright / E2E。

## 風險與取捨

- pages-first 可能讓初期邏輯集中在 page 層；以 `CLAUDE.md` 說明「何時下沉到 features/entities」緩解。
- Biome 無 FSD boundaries 專用規則，import 方向只能部分強制（`noRestrictedImports`）+ 文件約束；接受此限制以換取單一工具的低維護成本。
