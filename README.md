# TABIRUN

TABIRUN は、走りたいルートを地図上で自由に作成できるアプリです。日常のランニングから旅先でのランまで、自分に合ったコース作成をサポートします。

プロダクト方針・ロードマップ: [docs/ROADMAP.md](docs/ROADMAP.md)

デプロイ環境（本番 / staging / PR プレビュー / ローカル）と DB・環境変数: [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)

## 技術スタック

- Next.js
- React
- TypeScript
- NextAuth.js
- tRPC
- Drizzle ORM
- Tailwind CSS
- Zustand
- Google Maps Platform

## セットアップ

### 前提

- Node.js
- npm
- Google 認証および Google Maps Platform の利用に必要な環境変数
- Supabase（PostgreSQL）のデータベース接続先

### インストール

```bash
npm install
```

### 環境変数

`.env.example` をコピーして **`.env.local` を推奨**（`.env` でも可）し、各サービスで発行した値を設定します。これらのファイルは Git に登録しません。

```bash
cp .env.example .env.local
```

変数名の一覧と、本番・Preview・ローカルでの設定方針は [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md) を参照してください。

### 開発サーバー起動

```bash
npm run dev
```

## 主要コマンド

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test:run
npm run format:check
npm run test:coverage
npm run test:storybook
```

## データベース関連コマンド

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:seed
```

`db:migrate` はスキーマをデータベースへ適用します。`db:seed` は初期ペースデータを登録するため、新規データベースに対して一度だけ実行してください。Preview 用 DB への適用手順と注意（本番 DB を誤って触らないこと）は [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md) を参照してください。

ローカル専用 DB を Docker で立てる例は、リポジトリ直下の `docker-compose.yml` を参照してください。

## CI

GitHub Actions（`.github/workflows/ci.yml`）は、`main` と `staging` への pull request、および `main` への push で次を実行します。Node.js は `.nvmrc` の 24 系です。

- `npm run format:check`
- `npm run check`（lint と型チェック）
- `npm run test:run`
- `npm run build`

build は検証用のダミー環境変数を使い、データベースには接続しません。Storybook テストは CI の対象外です。

## ディレクトリ概要

- `src/app`: App Router のページとレイアウト
- `src/frontend`: UI、hooks、feature 単位のフロントエンド実装
- `src/server`: 認証、API、DB スキーマなどのサーバー実装
- `src/trpc`: tRPC クライアント/サーバー連携
