# TABIRUN Agent Instructions

走りたいルートを地図上で作るアプリ。Next.js 15 App Router / React 18 / TypeScript strict / NextAuth v5 / tRPC / Drizzle + Postgres(Supabase) / TanStack Query / Tailwind + shadcn/ui / Vitest / Storybook 9 / Google Maps。
環境・DB・環境変数の詳細は `docs/ENVIRONMENTS.md`、プロダクト方針は `docs/ROADMAP.md`、フロントエンドの書き方は `docs/FRONTEND_GUIDE.md`。

## 基本方針
- 日本語で、結論 → 理由 → 必要なら例 の順に報告する。
- 依頼範囲だけを小さく変更する。ついでのリファクタ・一括整形・命名変更をしない。
- 実装規約は今回追加・変更するコードにだけ適用する。既存コードの規約違反は修正せず、報告の「気づいた点」に記載する。承認・セキュリティ・Git操作のルールは作業全体に適用する。
- AGENTS.md や docs/FRONTEND_GUIDE.md の記述を、依頼範囲を広げる根拠にしない。範囲外の対応が必要と判断した場合は、手を付けずに提案して指示を待つ。
- 「確認する」とある項目は確認と結果の報告までを行う。不足があっても、それを理由に範囲外の実装や既存コードへのテスト・Story追加を行わない。
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

## 作業モード
- 既定値は実行環境で決まる:
  - **ローカルエージェント**（Codex、Cursor ローカルなど）: **確認モード**が既定。依頼に「commitして」「PRにして」「PRモード」などとある場合だけ **PRモード**。
  - **Cloud Agent**: **PRモード**が既定（手元に変更が残らないため）。
- **確認モード**: 作業ツリーのファイル編集だけ行う。stage・commit・push・branch作成/切替・PR操作はしない。編集ごとに変更ファイル、`git diff` の要点、実行した検証結果を報告して次の指示を待つ。ユーザーが「commitして」「PRにして」「PRモード」と言ったら PRモードに切り替える。
- **PRモード**: 作業branchで commit → push → 指定されたベース向け PR 作成まで行う（既存 PR があれば同じ branch で更新）。作業ステップの停止指示があるときは、「作業ステップ」が優先する。
- どちらのモードでも承認ゲートとセキュリティのルールは同じ。

## 作業ステップ
- 作業ステップと PR 単位は別物とする。
- 「ステップごとに進める」は、各ステップの実装・検証・報告のあとで停止し、次のステップの承認を待つ。ステップの完了だけでは commit・push・PR の作成や更新をしない。この停止は PRモードでも優先する。
- 停止していても、ユーザーが指示したタイミングと範囲の commit・push・PR は行う。「各ステップでcommitして」はそのとおり行う。「PR作成まで」は、その依頼の範囲が完了したときに行い、各ステップの完了ごとにはしない。停止指示がなければ、確認モードと Cloud Agent 既定の PRモードはこれまで通りとする。
- 次のステップの承認は、承認ゲートの個別承認や、本番DB・Preview DB・デプロイ・外部サービス設定の別途承認を兼ねない。

## コマンド
- Node 24（`.nvmrc`）、npm（`packageManager`）、lockfileは `package-lock.json`。install はローカル `npm install`、Cloud/CI は `npm ci`。
- CI相当の確認（文書・Skillのみの変更も含め、PR作成・更新前に必須）: `npm run format:check && npm run check && npm run test:run && npm run build`
  - `check` = lint + 型チェック。lintの実体はscripts側で管理する（Next 16 で `next lint` 廃止予定）。
- UI/story を変えたら追加で `npm run test:storybook`（CI対象外）。
- 整形: `npm run format:write`（変更ファイルのみに効かせる。無関係なファイルの差分はcommitしない）
- DB: schema変更・migration生成の個別承認を得た後、`npm run db:generate` で `drizzle/` にmigrationを生成してcommitする。`db:migrate` / `db:push` / `db:seed` はローカルDB（docker-compose か Cloud Agent VM）に対してだけ自由に実行してよい。Preview・本番DBには承認なしで実行しない。

## アーキテクチャと依存の向き
- `src/app`: page / layout / route handler。認証チェックとredirect、サーバーでのデータ取得、featureの画面コンポーネントの配置だけを行う。UIロジックは書かない。
- `src/frontend/features/<feature>/`: `api/`（tRPC hookのラッパー: `useXxxQuery` / `use<動詞><名詞>`）、`hooks/`（画面ロジック）、`components/`、`lib/`（純粋関数）、`types.ts`。
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

## フロントエンド
- 詳細は `docs/FRONTEND_GUIDE.md`。ここには要点だけを書く。
- page は認証・redirect・初期データ取得だけを行い、`<Feature><Action>Screen` に props で渡す。画面ロジック（送信・遷移・toast）は `hooks/use<Feature><Action>` に置く。
- client の取得は `features/*/api` の hook から行う。query は `useXxxQuery`、mutation は `use<動詞><名詞>`（例: `useUpdateRoute`）で、成功時に invalidate する。
- エラーは `TRPCError` の code だけで分岐し、server の `message` を表示しない。mutation の結果は toast、query の失敗は inline（`role="alert"`）、page では `NOT_FOUND` だけ `notFound()` にする。
- 新規 component は `PascalCase.tsx` で named export にし、型は `type XxxProps` で書く。テストと story は同じディレクトリに置く。

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
- 変更した重要な振る舞いとリスクに応じて検証を選ぶ。リスクに見合う検証であり、テストの一律削減ではない。
- 同じ振る舞いを hook / component / 画面で機械的に重ねない。層に固有のリスクは残す。重なりそのものは禁止しない。
- フレームワーク内部を再現する複雑なモックは避ける。準備が過大なら、テストする層を見直す。
- 選んだ検証では正常系に加え、境界値・異常系・回帰を書く。自動テストが保証することと、実ブラウザで確認すべきことを区別する。実行できなかった検証は理由を報告する。

## セキュリティ
- `.env`、token、認証情報、個人情報の値を表示・コピー・commit・ログ出力・報告しない。変数の有無だけを確認する。
- 依存の追加・更新は、目的・代替案・bundleや運用への影響を示して承認を得る。
- `DATABASE_URL` の接続先が本番か Preview か不明な状態で DB コマンドを実行しない。

## Git（共通）
- PR のベースは依頼に合わせて `main` または `staging` とし、指定がなければ `main` にする。
- staging向けの作業開始前・PR 作成・更新前に fetch し、`git log --oneline origin/staging..origin/main` でmainの未取り込みコミットを確認する。未取り込みがあれば内容・今回の作業への影響・検証中の内容を固定する必要性を報告し、先にmainを取り込むか、現在のstagingを基準に進めるか指示を待つ。取り込まず進める判断を得ている場合は、その前提に変更がないか確認する。同期は自動で行わず、stagingへの取り込みはユーザーが行う。
- 新規タスクでは、PRモードの作業開始前に `git fetch origin` を行い、最新の `origin/<ベース>` から作業branchを作成する。確認モードから移行する場合も最新ベースを確認し、未コミット変更があれば勝手にbranchを切り替えず、移行方法を提案して指示を待つ。
- 同一タスクの再開・継続は、既存の作業branchと、あればそのPRを使う。ステップが進んだことやセッションが再開したことだけを理由に、branchやPRを新しく作らない。PRモードで未コミット変更がなければ、その既存branchに移って続ける。確認モードでは branch を切り替えず、移る必要があるときは方法を提案して指示を待つ。PRを分けるときは、理由と分割案を示して事前に承認を得る。
- PR 作成・更新前に再度 `git fetch origin` を行い、`git rev-list --count HEAD..origin/<ベース>` が `0`（ベースより遅れていない）であることと、`git diff origin/<ベース>...HEAD` に依頼範囲外の変更がないことを確認する。遅れている場合は merge または rebase を提案して指示を待つ。履歴を書き換える rebase は対象と影響を示して個別承認を得る。
- `git add .` を使わず、自分が変えたパスだけを stage し、`git diff --cached` を確認してから commit する。
- commit メッセージは `feat:` / `fix:` / `refactor:` / `test:` / `docs:` / `chore:` + 短い要約。
- force push は禁止。rebase、squash、commit削除など履歴を書き換える操作やファイル・branchの削除は、対象と影響を示して個別に承認を得る。

## Git（stagingで確認した変更をmainへ出す）

staging で確認済みの変更を `main` に出すときは、次の順で検討する。

1. まず元の作業branchを使えるか確認する。最新の `main` を取り込んだあとの差分が今回のタスクの変更だけになるなら使えると判断する。`main` より遅れていることだけを理由に「使えない」にはしない。使えるなら、最新の `main` を取り込んでそのbranchから `main` 向けにPRを出す。取り込みは merge で行う。rebase や force push は履歴の書き換えなので、上記「Git（共通）」と同様に個別承認を得る。
2. staging に入っているものを全部出すなら、`staging` から `main` に PR を出す。
3. 新しい branch や cherry-pick は、1 も 2 も使えないときだけにする。その場合は、作業する前に YOSHIKI（ユーザー）に理由（1 と 2 が使えない根拠）と影響（増える branch・commit・PR、staging と main で履歴が分かれること）を説明して OK をもらってから行う。理由は PR 本文にも書く。

## Git（ローカル・Cloud Agent 共通の remote 操作）
- **PRモード**のとき、作業branch（例: `cursor/...`, `codex/...`）への push と、指定されたベース向けの PR 作成までは承認なしで行ってよい。作業ステップの停止中は、ステップ完了だけを理由に push や PR 作成をしない。確認モードでは push・PR 操作は行わない。
- `main` / `staging` への直接 push、merge、force push、PR以外への外部コメントはしない。merge はユーザーが行う。
- PR 作成後やベース変更後は、GitHub上の向き先・コミット・変更ファイルも確認し、意図した差分だけであることを確かめてから報告する。
- PR 本文に変更内容、設計判断、実行した検証（CI相当コマンドの結果）、未確認事項を書く。CI チェック名は `CI`。
- ユーザーの未コミット変更がある状態で branch 切り替えや push をしない。

## Cloud Agent 環境
- 作業モードの既定は **PRモード**（「作業モード」参照）。
- DB は VM 内の PostgreSQL 16（`tabirun`、`127.0.0.1:5432`）。起動時に `db:migrate` が実行され、空なら `db:seed` される。
- `.env` が無ければ起動スクリプトがローカル用の値を生成する。Google ログインと Routes API には実キーが必要で、無い場合は手動確認できない旨を報告する。
- dev サーバーは `npm run dev -- --hostname 0.0.0.0 --port 3000`。Storybook テストは Playwright Chromium で行う。
