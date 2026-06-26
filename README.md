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
