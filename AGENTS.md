# TABIRUN Repository Instructions

## 基本方針

- 日本語で、結論、理由、必要なら例の順に報告する。
- 既存の設計、命名、責務分離、依存方向を尊重し、小さく安全に変更する。
- ユーザーの既存変更を上書き、破棄、stash、stage、commitしない。
- 機能追加、修正、リファクタリング、設定・依存・DB変更では `$develop-with-approval` Skillを使用する。

## 承認ゲート

- ユーザーが明示的に承認不要または直ちに実装してよいと指示しない限り、調査、実装計画、承認、実装の順序を守る。
- 承認前は読み取り専用の調査と計画作成だけを行う。軽微な修正でも省略しない。
- 承認前は、ファイル変更、branch作成・切り替え、依存操作、migration、commit、push、PR作成、破壊的操作、生成物やキャッシュを書き得るコマンドを実行しない。
- 計画には、タスク理解、現状実装、採用方針、代替案、変更・新規ファイル、影響範囲、リスク、検証方法、branch候補、前提・不明点を含める。
- 承認後に計画が重大に変わる場合は、更新計画を示して再承認を得る。
- 本番変更とデプロイは、通常の実装承認とは別の明示的承認を必須とする。

## セットアップとコマンド

- Node.jsとnpmを使用する。package managerは `npm@11.0.0`、lockfileは `package-lock.json` とする。
- セットアップ: `npm install`
- 開発: `npm run dev`
- format確認: `npm run format:check`
- lint: `npm run lint`
- 型チェック: `npm run typecheck`
- unit test: `npm run test:run`
- coverage: `npm run test:coverage`
- Storybook test: `npm run test:storybook`
- build: `npm run build`
- Storybook build: `npm run build-storybook`
- DB生成: `npm run db:generate`
- `db:migrate`、`db:push`、`db:seed` は対象環境と影響を計画に記載し、明示的承認後だけ実行する。

## アーキテクチャ

- `src/app`: Next.js App Routerのpage、layout、composition。
- `src/frontend/features`: feature単位のUI、hooks、store。
- `src/frontend/components`: 複数featureで共有するUIとlayout。
- `src/frontend/hooks`、`src/frontend/lib`: feature非依存の再利用ロジック。
- `src/server/api`: tRPC router、procedure、middleware。
- `src/server/db`: Drizzle接続とPostgreSQL schema。
- `src/server/auth`: NextAuth設定。
- `src/shared/schemas`: client/serverで共有するZod schemaと型。
- `src/trpc`: tRPCとTanStack Queryのclient/server連携。
- `drizzle`: 生成されたmigrationとmetadata。

## 実装規約

- TypeScriptのstrictnessと `noUncheckedIndexedAccess` を維持し、`any` を使わない。
- 外部入力、API入力、永続化したJSONはZodなどでruntime validationする。
- React componentに業務ロジックやAPI呼び出しを直接書かず、feature hooksへ分離する。
- mutation成功時は影響するTanStack Query/tRPC queryをinvalidateする。
- local UI stateと共有stateを分け、共有stateは必要な場合だけZustand storeへ置く。
- DBのupdate/deleteには、対象IDだけでなく認可に必要な所有者条件を含める。
- importは `~/*` aliasと既存の近接import規約を尊重する。
- UI変更ではloading、empty、error、disabled、keyboard操作、accessibility、mobile/desktop表示を確認する。
- コードコメントは周辺コードの言語に合わせ、処理の逐語説明ではなく理由を残す。

## テストと検証

- テストは原則として対象実装の近くに `*.test.ts` または `*.test.tsx` で配置する。
- hooks/store/libはVitestとTesting Libraryで振る舞いを検証する。
- UI componentは利用者視点のqueryとinteractionを優先し、必要に応じてStorybookを更新する。
- 正常系だけでなく、境界値、異常系、認可、回帰リスクをテストする。
- コード変更後は原則としてformat、lint、型チェック、unit test、buildを実行する。UI/Story変更ではStorybook testも行う。
- 実行できない検証は、理由と未確認項目を最終報告へ明記する。

## セキュリティとGit

- `.env`、認証情報、token、個人情報の値を表示、コピー、commit、ログやPR本文へ記載しない。
- 環境変数を追加・変更する場合は `src/env.js` と `.env.example` の整合を保ち、exampleに実値を入れない。
- 外部依存の追加・更新は、目的、代替案、bundle/運用影響を示して承認を得る。
- 破壊的Git操作、自動stash、`git add .`、無関係な一括整形を避ける。
- 実装後は `git status`、`git diff --check`、`git diff` で自己レビューし、問題があれば修正、再検証、再レビューする。
- 自分が変更したパスだけをstageし、`git diff --cached` を確認してからcommitする。
- pushとPR作成は計画に含めて承認された場合だけ行う。認証・権限がなければ未実施作業と実行コマンドを報告する。
