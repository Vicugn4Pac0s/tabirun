# TABIRUN

TABIRUN は、走りたいルートを地図上で自由に作成できるアプリです。日常のランニングから旅先でのランまで、自分に合ったコース作成をサポートします。

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

`.env.example` をコピーして `.env` を作成し、各サービスで発行した値を設定します。`.env` はGitに登録しないでください。

```bash
cp .env.example .env
```

- `AUTH_SECRET`: NextAuth.js のシークレット
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Googleログイン用のOAuth認証情報
- `DATABASE_URL`: Supabase PostgreSQLの接続文字列
- `NEXT_PRIVATE_GOOGLE_MAP_API_KEY`: サーバー側のRoutes API用キー
- `NEXT_PUBLIC_GOOGLE_MAP_API_KEY`: ブラウザ側のMaps JavaScript API用キー

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

`db:migrate` はスキーマをデータベースへ適用します。`db:seed` は初期ペースデータを登録するため、新規データベースに対して一度だけ実行してください。

## ディレクトリ概要

- `src/app`: App Router のページとレイアウト
- `src/frontend`: UI、hooks、feature 単位のフロントエンド実装
- `src/server`: 認証、API、DB スキーマなどのサーバー実装
- `src/trpc`: tRPC クライアント/サーバー連携
