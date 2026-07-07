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
- SQLite / Turso 互換のデータベース接続先

### インストール

```bash
npm install
```

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
```

## データベース関連コマンド

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
```

## ディレクトリ概要

- `src/app`: App Router のページとレイアウト
- `src/frontend`: UI、hooks、feature 単位のフロントエンド実装
- `src/server`: 認証、API、DB スキーマなどのサーバー実装
- `src/trpc`: tRPC クライアント/サーバー連携
