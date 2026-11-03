# TABIRUN Agent Instructions

走りたいルートを地図上で作るアプリ。Next.js 15 App Router / React 18 / TypeScript strict / NextAuth v5 / tRPC / Drizzle + Postgres(Supabase) / TanStack Query / Tailwind + shadcn/ui / Vitest / Storybook 9 / Google Maps。
環境・DB・環境変数の詳細は `docs/ENVIRONMENTS.md`、プロダクト方針は `docs/ROADMAP.md`。

## 基本方針
- 日本語で、結論 → 理由 → 必要なら例 の順に報告する。
- 依頼範囲だけを小さく変更する。ついでのリファクタ・一括整形・命名変更をしない。
- 既存の設計・命名・依存の向きに合わせる。迷ったら近くの既存実装を真似る。
- ユーザーの未コミット変更を上書き・破棄・stash・stageしない。

## 承認ゲート
- 原則: 調査 → 計画 → 承認 → 実装。承認前は読み取りだけ行う。
- 次のいずれかは承認済みとみなし、計画提示を省いて実装してよい:
  - 依頼文が「承認不要」「そのまま実装して」と明示している。
  - Cloud Agentの起動指示が、変更範囲と完了条件を具体的に示している。
  - typo・文言・コメントのみの軽微な修正（ローカル・Cloud共通）。
- 上記の計画省略条件にかかわらず、次は対象と影響を示して個別に承認を得る: 依存の追加・更新、DB schema変更とmigration生成、`src/env.js`の変更、指示範囲を超える変更、削除・履歴書き換え。
- 本番DB・Preview DBへの操作、デプロイ、Vercel/Supabase/Google Cloudの設定変更は、実装承認とは別に毎回明示承認を得る。
- 計画の詳細手順とテンプレートは `$develop-with-approval` Skillに従う。

## コマンド
- Node 24（`.nvmrc`）、npm（`packageManager`）、lockfileは `package-lock.json`。install はローカル `npm install`、Cloud/CI は `npm ci`。
- CI相当の確認（文書・Skillのみの変更も含め、PR作成・更新前に必須）: `npm run format:check && npm run check && npm run test:run && npm run build`
  - `check` = lint + 型チェック。lintの実体はscripts側で管理する（Next 16 で `next lint` 廃止予定）。
- UI/story を変えたら追加で `npm run test:storybook`（CI対象外）。
- 整形: `npm run format:write`（変更ファイルのみに効かせる。無関係なファイルの差分はcommitしない）
- DB: schema変更・migration生成の個別承認を得た後、`npm run db:generate` で `drizzle/` にmigrationを生成してcommitする。`db:migrate` / `db:push` / `db:seed` はローカルDB（docker-compose か Cloud Agent VM）に対してだけ自由に実行してよい。Preview・本番DBには承認なしで実行しない。

## アーキテクチャと依存の向き
- `src/app`: page / layout / route handler。認証チェックとredirect、サーバーでのデータ取得、featureの画面コンポーネントの配置だけを行う。UIロジックは書かない。
- `src/frontend/features/<feature>/`: `api/`（tRPC hookのラッパー: `useXxxQuery` / `useXxxMutation`）、`hooks/`（画面ロジック）、`components/`、`lib/`（純粋関数）、`types.ts`。
- `src/frontend/components/ui`: shadcn/ui の生成物。追加は shadcn CLI（`components.json`）で行い、手での大改造はしない。
- `src/frontend/components/app-ui`: 2つ以上のfeatureで使う見た目だけの部品。feature・tRPC・業務知識に依存しない。
- `src/frontend/hooks/shared`, `src/frontend/lib`: feature非依存の汎用処理。
- `src/shared/schemas`: client/server共通のZod schemaと推論型。入力制約の唯一の定義元。
- `src/server/api`（routers / procedure / middleware）、`src/server/db`（schema・接続）、`src/server/auth`、`src/server/quota`、`src/server/features/*`（RSCから呼ぶ `server-only` の読み取り）。
- 依存ルール:
  - `frontend` → `server` は `import type` のみ（例: `AppRouter`）。値のimportは禁止。
  - feature間は上位 → 下位の一方向のみ、循環禁止。下位: `googlemap`, `pace` / 中位: `route-points`, `run-metrics`, `user`, `auth` / 上位: `route`, `dashboard`。新しいfeature間依存を作るときは計画に書く。
  - `components/*`, `hooks/shared`, `lib` から `features` を import しない。
  - 業務ルール: 入力制約は `shared/schemas`、認可・所有者条件・クォータは server、表示用の計算は `features/*/lib`。componentに業務ルールを書かない。

## 共通化の基準
- 共通化は3箇所目の重複が出てから。2箇所なら原則そのまま重複させる。
- 「見た目が似ている」ではなく「同じ理由で同時に変わる」ものだけを共通化する。
- 共通化のために boolean / variant / type props を増やさない。props の分岐が増えるなら別コンポーネントに分ける。
- 差分は children / slot（`panel` などのReactNode props）で受ける合成を優先する（例: `WarningBanner`, `RouteScreenLayout`, `RouteForm`）。
- 共通部品の props は5〜7個を目安に少なく保つ。個数だけで一律にNGとはしないが、異なる責務の混在、利用箇所ごとの boolean / variant 分岐、同時に成立しない props の組み合わせが必要になる設計はNG。目安を超える場合は、分割・children/slot化・共通化しない案を比較し、採用理由を示す。
- 共通化・リファクタを提案するときは、計画に必ず次を書く: 共通化しない案、変更後の props 一覧と数、利用箇所の数、将来の変更でどちらが楽か。
- feature内でしか使わないものは feature内に置く。`components/app-ui` に上げるのは2feature以上で使ってから。

## 実装規約
- TypeScript strict と `noUncheckedIndexedAccess` を維持する。`any`・不要な `as`・`!` を増やさない。
- 外部入力・tRPC input・外部APIレスポンス・DBに保存したJSONはZodで検証する（例: `routePointsSchema.parse(JSON.parse(route.points))`）。
- tRPC: 未ログインでも使えるAPIだけ `publicProcedure`。それ以外は `protectedProcedure`。課金やクォータ対象の外部APIは `quotaProtectedProcedure(feature)` を使い、成功後に `incrementQuota()` を呼ぶ。上限は `src/server/quota/config.ts`。
- DB: update/delete/select の where に ID と所有者条件（`createdById = ctx.session.user.id` など）を両方入れる。lintはwhereの有無しか見ない。
- DBアクセスは Drizzle（`~/server/db`）のみ。supabase-js や Supabase Data API は使わない（Data API は無効）。
- React: componentから tRPC を直接呼ばず `features/*/api` のhookを使う。mutation成功時は影響するqueryをinvalidateする。
- 状態: まずローカルstate / react-hook-form / TanStack Query で済ませる。Zustand は複数画面で共有するクライアント状態が必要なときだけ（現状は未使用）。
- スタイル: Tailwind を使う。class の結合は `cn()`（`~/frontend/lib/utils`）を使う。色はテーマ変数を優先する。
- 新規コンポーネントは named export。import は `~/` alias。
- 環境変数は `src/env.js` に schema を追加して `env` から読む。`.env.example` には変数名だけを足す。`process.env` を直接読む箇所を増やさない。
- UI変更では loading / empty / error / disabled、キーボード操作、a11y、モバイル/デスクトップを確認する。
- コメントは周辺コードの言語に合わせ、何をするかではなく理由を書く。

## テスト
- テストは対象の隣に `*.test.ts(x)`。hooks / lib / router は Vitest + Testing Library で振る舞いを検証する。
- router は `createCaller` と `~/server/db` の mock で、認可（他人のデータに触れないこと）を必ずテストする（例: `routers/route.test.ts`）。
- 見た目の部品は隣に `*.stories.tsx` を置き、操作は `play` で検証する。title はディレクトリ構成に揃える（`App UI/<Component>`、`Features/<Feature>/<Component>`）。Atoms/Molecules は使わない。
- 正常系に加えて境界値・異常系・回帰を書く。実行できなかった検証は理由を報告する。

## セキュリティ
- `.env`、token、認証情報、個人情報の値を表示・コピー・commit・ログ出力・報告しない。変数の有無だけを確認する。
- 依存の追加・更新は、目的・代替案・bundleや運用への影響を示して承認を得る。
- `DATABASE_URL` の接続先が本番か Preview か不明な状態で DB コマンドを実行しない。

## Git（共通）
- `git add .` を使わず、自分が変えたパスだけを stage し、`git diff --cached` を確認してから commit する。
- commit メッセージは `feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:` + 短い要約。
- force push は禁止。rebase、squash、commit削除など履歴を書き換える操作やファイル・branchの削除は、対象と影響を示して個別に承認を得る。

## Git（ローカル・Cloud Agent 共通の remote 操作）
- 作業branch（例: `cursor/...`, `codex/...`）への push と、`main` 向けの PR 作成までは承認なしで行ってよい。
- `main` / `staging` への直接 push、merge、force push、PR以外への外部コメントはしない。merge はユーザーが行う。
- PR 本文に変更内容、設計判断、実行した検証（CI相当コマンドの結果）、未確認事項を書く。CI チェック名は `CI`。
- ユーザーの未コミット変更がある状態で branch 切り替えや push をしない。

## Cloud Agent 環境
- DB は VM 内の PostgreSQL 16（`tabirun`、`127.0.0.1:5432`）。起動時に `db:migrate` が実行され、空なら `db:seed` される。
- `.env` が無ければ起動スクリプトがローカル用の値を生成する。Google ログインと Routes API には実キーが必要で、無い場合は手動確認できない旨を報告する。
- dev サーバーは `npm run dev -- --hostname 0.0.0.0 --port 3000`。Storybook テストは Playwright Chromium で行う。
