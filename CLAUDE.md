# CLAUDE.md

General-purpose React frontend template: Vite + React 19 + TS, FSD v2.1 pages-first, Biome as the single toolchain.

## Response language

Always reply in Traditional Chinese (繁體中文) with Taiwan-localized wording, even when asked in English —
use 程式碼／資料／函式／物件／介面／型別／快取／預設／效能, never 代碼／數據／函數／對象／接口／類型／緩存／默認／性能.
Code identifiers, file names, directory names, and package names stay in English.

## Human-only operations ⛔

Never run these yourself — stop and hand the exact command to the user
(`.claude/settings.json` and `.claude/hooks/block-human-only.sh` also block them):
- Deploying (uploading to S3/CloudFront or any prod environment), reading or writing a prod `.env`
- `git push` (any branch), force-push, rewriting published history
- Calling real third-party APIs / webhooks (incl. any reporting endpoint other than Sentry)

## Commands

- `bun run dev` — dev server
- `bun run build` — bundle only; type-checking is `type-check`'s job
- `bun run format` — Biome format + fix + organize imports
- `bun run lint` — Biome lint (`lint:ci` = lint + format check, no writes)
- `bun run lint:fsd` — steiger FSD boundary check (exceptions in `steiger.config.ts`)
- `bun run type-check` — `tsc -b`
- `bun run test` / `bun run test:watch` — Vitest
- `bun run gen:api` — generate `src/shared/api/schema.d.ts` from the backend OpenAPI (`OPENAPI_URL`,
  default `http://localhost:8000/openapi.json`). Commit the output; Biome skips it.

CI (`.github/workflows/ci.yml`) runs lint:ci + lint:fsd + type-check + test + build; the pre-commit hook
(simple-git-hooks, installed by `bun install`) runs lint + type-check.

## Architecture: FSD v2.1 (pages-first)

Layers, top to bottom: `app → pages → widgets → features → entities → shared`.
The template ships only `app / pages / shared`; extract `features / entities / widgets` when complexity demands it.

### Import rules (hard rules, enforced by steiger + Biome `noRestrictedImports`)
- Upper layers import lower layers, never the reverse.
- Slices on the same layer never import each other.
- Cross-slice imports go through the slice's `index.ts` (public API), never deep into a segment.
  Test files may deep-import (see `steiger.config.ts`).
- Always use the `@/` alias, never relative paths that climb layers.
- Segments: `ui` (components) / `model` (state, Zustand) / `api` (Query hooks + calls) / `lib` (pure functions) / `config`.

### When to extract to features / entities
- The same UI/logic is used by **two or more pages** → `features` or `widgets`.
- A business entity's types and API are shared across pages (user, product) → `entities/<name>`.
- Until then, keep the logic inside the page slice; do not split in advance.

New page → use the **scaffold-page** skill.

## Platform primitives (`src/shared`) — use these, don't reinvent

Before changing anything inside `shared/auth`, `shared/api`, `shared/i18n`, or the error-handling
primitives, read `docs/platform.md`.

- **Auth**: `useAuth()`, `usePermission()`, `<RequireAuth>`, `<RequireRole role>`. Frontend guards are UX
  only; the backend authorizes.
- **API**: `apiGet/apiPost/apiPut/apiPatch/apiDelete<T>` from `@/shared/api`. The client unwraps the
  `BaseResponse` envelope, so `T` is the inner type (`apiGet<Article>`, not `apiGet<BaseResponse<Article>>`).
  Branch on `ApiError.reason` (a stable code such as `"username_taken"`, usable as the i18n key
  `errors.<reason>`), never on `message`.
- **Types**: when `schema.d.ts` exists, use `components["schemas"]["XxxResponse"]`; never hand-write backend types.
- **i18n**: `const { t } = useTranslation()`; add keys to `locales/zh-TW.json` first (it is the type source).
  zod schema messages are i18n keys.
- **Errors**: `reportError(error, context?)`; `<ErrorBoundary>` already wraps the router.
- **Forms**: `useZodForm(schema)`.

## Frontend–backend conventions

- **Fixed-shape API types**: response / POST / PATCH types list every field; nullable is `| null`, never `?`
  (`?` is for query params only). Check with `=== null`. Hand-written contract interfaces get JSDoc on
  each field, matching the backend's field description.
- **Backend string enums are literal unions**: `type Status = "draft" | "published"`, values copied from
  the backend; no TS `enum`.
- **Time is a UTC contract**: always send an offset (`toISOString()` or `+08:00`); to display, `new Date(v)`
  then format — never `slice(0, 10)`. Date-only fields: start gets `00:00:00+08:00`, end gets
  `23:59:59.999999+08:00`.
- **Navigate with links**: plain navigation is `<Link>`, not `onClick` + `navigate`; use `navigate` only
  after validation, confirmation, or a successful API call.
- **Routes**: kebab-case plural nouns; IDs are route params (`/users/$userId`), not query strings.
- **Functions**: top-level functions use `function`; arrow functions only as arguments or object property values.

## Code Style

- Biome: indentWidth 2, lineWidth 100, double quotes, organizeImports.
- `noExplicitAny: warn` — avoid `any`.

## How to work

- **TDD**: failing test first (RED) → minimal implementation (GREEN) → refactor.
- Before you finish, run the **check** skill (Biome + steiger + tsc + Vitest). Report unverified items as
  unverified — never tick something you didn't run.
- Design and plan documents go in `docs/superpowers/` (gitignored, local only).

## Git

- Commit format `<type>: <description in Chinese>`; type is one of `feat` / `fix` / `docs` / `style` /
  `refactor` / `test` / `chore`. The description is written in Chinese. No scope (never `feat(auth):`).
- Breaking change (callers break unless they change code): add `!` after the type — `feat!: 移除 apiPut`.
- Branch `<type>/<description>`, type one of `feat` / `fix` / `refactor` / `docs` / `chore`;
  never commit directly to `main`.
