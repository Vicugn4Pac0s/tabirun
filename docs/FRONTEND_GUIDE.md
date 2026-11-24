# Frontend Guide

`AGENTS.md`（依存の向き・共通化・実装規約）の補足。ここには AGENTS.md に無い「書き方」だけを書く。迷ったら近くの既存実装を真似る。

既存コードとのずれは、そのファイルを触る依頼の範囲内でのみ直す。一括修正はしない。

## 1. コンポーネント設計

- 画面は `src/app/**/page.tsx` → feature の画面コンポーネント、の形にする。page は認証・プロフィール状態に応じた画面の出し分けやredirect・取得・`<main>` での配置だけ（例: `app/routes/[id]/page.tsx` → `RouteDetailScreen`）。
- page ではDBを直接クエリせず、`src/server/features/<feature>/` の副作用のない読み取り関数（`import "server-only"`。例: `user/service.ts` の `getUserHomePageSettings`）か `~/trpc/server` の `api` を使う。読み取り関数へ `db` を渡すためのimportは許容する（例: `app/page.tsx`、`app/setup-profile/page.tsx`）。
- 画面コンポーネントは `<Feature><Action>Screen`。Context が要る画面は外側で Provider を巻き、中身は同じファイルの非 export `XxxContent` に書く（例: `RouteCreateScreen.tsx` の `GoogleMapProvider` + `RouteCreateScreenContent`）。
- 新規 component は **named export**（既存の default export は触らない）。ファイル名は `PascalCase.tsx` = コンポーネント名。props 型は **`type XxxProps`**（新規のみ。既存は触らない）。
- component と `hooks/` の画面ロジック hook は **`function` 宣言**、`features/*/api/` の hook は **アロー関数**。
- `src/app` から直接 import される client 境界には **`"use client"` を必ず付ける**。子 component への付与は任意。
- 画面ロジック（送信・遷移・toast・二重送信防止・confirm）は `hooks/use<Feature><Action>` に出し、component は hook の戻り値を並べるだけにする（例: `useRouteCreation` / `useRoutePointsEdit` / `useRouteDeletion`）。
- 再表示で state を捨てたい画面は page 側で `key` を渡す（例: `<RoutePointsEditScreen key={route.id} route={route} />`）。
- 差分は `children` / `panel` などの ReactNode で受ける（例: `RouteScreenLayout` の `panel`）。文言差分はオブジェクト1つで渡す（idle / pending など、同時に変わる文言をまとめる）。
- props にデータ取得の hook を渡さない。取得は使う側（画面 or 葉の部品）で `features/*/api` の hook を呼ぶ（例: `PaceSelect` が `usePacesQuery` を内部で呼ぶ）。
- `src/frontend/components/app-ui` の部品は tRPC・feature・業務文言を持たない（例: `WarningBanner`, `StatValue`, `Selectbox`）。
- フォームは react-hook-form + `zodResolver(shared/schemas の schema)`。フォーム値には `shared/schemas` で `z.infer` から定義した型を使う（例: `UserProfileUpdateInput`）。
  - `useForm` と送信処理は画面hookが持ち、フォームcomponentは渡されたformでフィールドを描画する（例: `useUserInitialProfile` → `InitialProfileForm`、`useUserProfileEdit` → `UserProfileEditForm`）。
  - dirty 管理・離脱確認・地点操作を伴うルートでは `useRoutePointsForm` がformと編集状態を持つ。
  - 送信ボタンは送信中に無効化する。ルートでは保存可否も含めて `disabled={!canSave || isSubmitting}` とし、ラベルは pending 中に「〜中...」へ切替。
- 入力のラベルとエラーは `FormField` を使い、子の入力に渡された属性を展開する。`aria-invalid` + `aria-describedby` + `role="alert"` を接続し、エラー色は **`text-destructive`**。表示タイミングの判断は呼出側に残す（例: `RouteDetailsForm`）。共通 `FieldError` 部品は作らない。
- 状態表示はテキスト + ARIA: 読み込み中 `<p role="status">…読み込み中...</p>`、エラー `<p role="alert" className="text-destructive">`、空状態は説明 + 次の行動へのボタン（例: `Dashboard.tsx` のルート一覧）。地図上は `LoadingOverlay`。
- アプリ共通のエラー画面は実装済みの **`app/not-found.tsx`** と **`app/error.tsx`** を使う。**`loading.tsx` は今は作らない**。
- 共通の離脱確認は `frontend/providers/NavigationGuardProvider` が配下に提供する。`GuardedLink` は Next.js の `Link` の `onNavigate` で確認し、拒否時は遷移を中止する。Providerの外では通常どおり遷移する。ルート画面では `RouteScreenLayout` に `confirmNavigation` を渡してProviderを設ける。

## 2. データ取得とエラー処理

### 取得

- サーバー（RSC）: 画面の初期データは page で取得して **props で渡す**。`HydrateClient` は **prefetch するときだけ** 使う。
  - tRPC 経由: `api` from `~/trpc/server`（例: `api.route.getById`）。
  - 型は `RouterOutputs[...]` から `Pick` する（例: `RouteDetailScreen` の props 型）。
- クライアント: 更新・共有するデータは `features/*/api/useXxxQuery` 経由。戻り値は `{ <名前付きデータ>, isLoading, error }` で、一覧は `?? []`、単体は `?? null`（例: `useRoutesQuery`, `useCurrentUserQuery`）。
- `staleTime: Infinity` を既定にし、鮮度は mutation 側の invalidate で保つ。外部 API 課金系は `retry: false`（例: `useGoogleMapDirectionQuery`）。
- mutation hook 名は **`use<動詞><名詞>`**（例: `useUpdateRoutePoints`）。戻り値は `{ <動詞>, is<動詞ing>, error, reset }`（例: `updatePoints`, `isUpdating`）。`onSuccess` で影響する query を `Promise.all` で invalidate する。
- mutation の結果は **`try { await ... } catch { toast.error(...) }`** で受ける。
- toast の文言は **「。」で終える**。mutation の成否は toast、**query の失敗は inline**（`role="alert"`、`text-destructive`）。
- 保存・削除後に一覧が RSC 由来の画面へ戻るときは `router.push|replace` の後に `router.refresh()`（例: `useRouteCreation`）。

### エラー

- 保護対象のpageは `server/auth/getProtectedPageState.ts` で状態を取得し、未ログイン・初期設定前ならapp層の `app/_components/ProtectedPageFallback.tsx` に状態を渡して早期returnする。準備完了時だけpage内でデータ取得と通常画面の描画へ進む。未ログインなら `LoginScreen`、プロフィール行が存在して未完了なら `UserInitialProfileScreen` をその場で表示し、redirectしない。プロフィール行がない場合は通常の画面描画へ進む。
- ホーム（`app/page.tsx`）はプロフィール行が存在して未完了なら `/setup-profile` へredirectする。`app/setup-profile/page.tsx` は未ログインならログイン画面を表示し、プロフィール行がない、または完了済みなら `/` へredirectする。
- URL param は Zod で検証し不正なら `notFound()`。
- page での tRPC 呼び出しは `TRPCError` の `NOT_FOUND` だけ `notFound()` に変え、それ以外は再 throw する（404 で隠さない。`app/routes/[id]/page.test.tsx` がこれを検証）。
- router: 所有者条件付きで見つからなければ `NOT_FOUND`、未ログイン `UNAUTHORIZED`（`protectedProcedure`）、クォータ `TOO_MANY_REQUESTS`（`checkQuota`）。
- frontend は `error.data?.code` でだけ分岐し、server の `message` を画面に出さない。ユーザー向け文言は frontend（`features/*/lib`）で決める（例: `getRouteCalculationWarningMessage` が `TOO_MANY_REQUESTS` を上限メッセージに変換）。
- 出し分け: mutation → `toast.success` / `toast.error`（sonner。`Toaster` は `app/layout.tsx`）。query 失敗 → inline。続行可能なら `WarningBanner` で縮退（例: 経路取得失敗時は直線表示）。入力エラー → フィールド直下。
- エラー文言は「〜できませんでした。時間をおいて再度お試しください。」を基本にする。

## 3. 命名とファイル構成

- feature内の複数ファイルで使う定数は `features/<feature>/constants.ts` に置く。ファイル内だけで使う定数はそのファイルに置く（例: `RunMetricsPanel` の `DEFAULT_WEIGHT_KG`）。
- アプリ共通の定数・設定は `frontend/config.ts` に置く（例: 地図の初期位置・ズーム）。featureに閉じない共通型は `frontend/types/` に置く（例: 汎用の `frontend/lib/running.ts` からも使う、共有schemaから推論した `Pace`）。入力制約とその推論型は引き続き `shared/schemas` に置く。
- `components/ui` だけは shadcn 生成の kebab-case（例: `dropdown-menu.tsx`）。
- hook ファイルは `useXxx.ts`。query は `useXxxQuery`、画面ロジック hook は `use<Feature><Action>`（例: `useRouteCreation`, `useRoutePointsForm`）。
- lib: 1関数1ファイル、`camelCase` の動詞始まり（`getRouteMenuLabel.ts`）。汎用の計算群は1ファイルにまとめてよい（`frontend/lib/running.ts`）。
- feature の型は `features/<feature>/types.ts`、Context は `features/<feature>/providers/XxxProvider.tsx`（例: `GoogleMapProvider`、`useGoogleMap` を同ファイルから export）。
- feature非依存の共通Contextと関連部品は `frontend/providers/` に置く（例: `NavigationGuardProvider`、`GuardedLink`）。feature間の依存方向と同階層の許容する依存は `AGENTS.md` に従い、循環や逆方向の依存を作らない。
- イベント props は `onXxx`（`onTogglePoint`, `onPaceChange`, `onOpenChange`）。boolean は `is/can/show/has` か HTML 属性名（`disabled`）。
- テスト・story は対象と同じディレクトリに `Xxx.test.tsx` / `Xxx.stories.tsx`。page のテストは `page.test.tsx`。
- import は `~/`。同じ feature 内は相対パス（`../api/useCreateRouteDraft`）でもよい（現状 route feature はこの形）。
