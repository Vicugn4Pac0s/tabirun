# デプロイ環境とローカル開発

TABIRUN の実行環境（本番・staging・PR プレビュー・ローカル）と、データベース・環境変数の扱いをまとめたドキュメントです。

## 環境一覧

| 環境 | Git ブランチ | URL | データベース |
| --- | --- | --- | --- |
| 本番 | `main` | https://tabirun.vercel.app | 本番 Supabase プロジェクト |
| staging | `staging` | https://tabirun-staging.vercel.app | Preview 用 Supabase（`tabirun-preview`） |
| PR プレビュー | PR ごとのブランチ | Vercel が発行する Preview URL | Preview 用 Supabase（`tabirun-preview`） |
| ローカル | 作業ブランチ | http://localhost:3000（`npm run dev`） | 任意（下記「ローカル開発」参照） |

- 本番は Vercel **Production** デプロイです。
- staging と PR プレビューは Vercel **Preview** デプロイで、Vercel 上の **Preview** 環境変数を共有します。
- staging サイトは Vercel のデプロイ保護（Vercel アカウントへのログイン）が有効です。
- PR プレビューも staging と同様に Preview 環境変数を使いますが、URL は PR ごとに異なります。

## staging の使い方

`main` の内容を staging に早送りして push すると、staging 用 URL へ自動デプロイされます。

```bash
git fetch origin
git checkout staging
git merge --ff-only origin/main
git push origin staging
```

閲覧時は Vercel のデプロイ保護のため、許可された Vercel アカウントでログインが必要です。

Google OAuth のリダイレクト URI として、staging 用に `https://tabirun-staging.vercel.app/api/auth/callback/google` が登録済みです。

## Preview 用データベース（マイグレーション・シード）

Preview 環境（staging・PR プレビュー）が参照する DB は、本番とは別の Supabase プロジェクト `tabirun-preview` です。スキーマ変更を Preview に反映するときは、**接続先が Preview 用であることを確認したうえで**、リポジトリルートから次を実行します。

```bash
# DATABASE_URL が Preview 用（tabirun-preview）であることを確認してから実行する
npm run db:migrate
```

初期データ（ペースマスタ）が未投入の空 DB に対しては、マイグレーション後に一度だけ:

```bash
npm run db:seed
```

**本番 Supabase の `DATABASE_URL` を指したままこれらを実行しないでください。** 誤接続を防ぐため、実行前に Supabase ダッシュボードまたは Vercel の Preview 環境変数で接続先プロジェクトを確認してください。

スキーマ定義の変更を開発する場合は `npm run db:generate` で migration を生成し、生成物は `drizzle/` にコミットします。ローカル DB への試行錯誤には `npm run db:push` も使えますが、Preview / 本番への適用は `db:migrate` を前提とします。

参考コマンド: `npm run db:studio`（Drizzle Studio）、`npm run db:generate`、`npm run db:push`。

## ローカル開発

### 環境変数ファイル

秘密の値はリポジトリに含めません。`.env.example` をコピーし、**`.env.local` を推奨**（`.env` でも Next.js は読み込みます）。いずれも Git 管理外です。

```bash
cp .env.example .env.local
```

各変数の意味と環境ごとの設定方針は、下記「環境変数一覧」を参照してください。

### データベースの選び方

| 用途 | おすすめの DB | 備考 |
| --- | --- | --- |
| 手軽にアプリを触る | Preview 用 Supabase（`tabirun-preview`） | staging と **同じ DB を共有**します。データやスキーマ試行の影響に注意 |
| スキーマ変更・破壊的操作の試行 | ローカル専用 PostgreSQL | Docker などで立てた DB を推奨 |

#### ローカル PostgreSQL（Docker）の例

リポジトリ直下の `docker-compose.yml` で PostgreSQL 16 を起動できます。

```bash
docker compose up -d
```

接続例（ダミー値。実際のパスワードは compose ファイルの設定に合わせる）:

```text
DATABASE_URL="postgresql://tabirun:tabirun@127.0.0.1:5432/tabirun"
```

初回は `npm run db:migrate` のあと、必要なら `npm run db:seed` を実行します。

### 開発サーバー

```bash
npm install
npm run dev
```

Cloud Agent など VM 内開発では、PostgreSQL をホスト上で用意し `DATABASE_URL` を合わせる運用もあります（詳細はリポジトリの `AGENTS.md`）。

## 環境変数一覧

値は Vercel ダッシュボード・Supabase・Google Cloud Console などで管理し、**リポジトリには書きません**。変数名のみ記載します。

| 変数名 | 本番 | Preview（staging / PR） | ローカル |
| --- | --- | --- | --- |
| `AUTH_SECRET` | 本番専用 | Preview 専用 | 任意（開発時は未設定可。本番ビルドでは必須） |
| `DATABASE_URL` | 本番 Supabase（Transaction pooler 推奨） | `tabirun-preview` 用 | Preview 用 URL、またはローカル Docker 等 |
| `GOOGLE_CLIENT_ID` | 本番 OAuth クライアント | 本番と共用 | 開発用に同じ値を設定するか、別クライアントを用意 |
| `GOOGLE_CLIENT_SECRET` | 本番 OAuth クライアント | 本番と共用 | 上記に対応する Secret |
| `NEXT_PUBLIC_GOOGLE_MAP_API_KEY` | 本番用 Maps JS API キー | 開発用キー（リファラー制限あり） | 通常は開発用キー |
| `NEXT_PRIVATE_GOOGLE_MAP_API_KEY` | サーバー Routes API 用 | 本番と共用 | 本番と同じキーを設定することが多い |

Supabase の接続文字列（`DATABASE_URL`）は、サーバーレス向けに **Transaction pooler**（ポート `6543`、`postgres.<project-ref>` 形式のユーザー名、`?sslmode=require`）を使う構成を推奨します。具体例は `.env.example` を参照してください。

Vercel では、本番デプロイに **Production** 環境変数、staging と PR プレビューに **Preview** 環境変数を設定します。

## 関連ドキュメント

- セットアップの概要: [README](../README.md)
- プロダクト方針: [ROADMAP.md](./ROADMAP.md)
