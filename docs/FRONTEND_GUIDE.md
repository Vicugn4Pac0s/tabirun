# Frontend Guide

`AGENTS.md`（依存の向き・共通化・実装規約）の補足。ここには AGENTS.md に無い「書き方」だけを書く。迷ったら近くの既存実装を真似る。

既存コードとのずれは、そのファイルを触る依頼の範囲内でのみ直す。一括修正はしない。

## 1. コンポーネント設計

- 画面は `src/app/**/page.tsx` → feature の画面コンポーネント1つ、の形にする。page は認証・redirect・取得・`<main>` での配置だけ（例: `app/routes/[id]/page.tsx` → `RouteDetailScreen`）。
- page では `db` を直接読まず、`src/server/features/<feature>/queries.ts`（`import "server-only"`。例: `getUserHomePageSettings`）か `~/trpc/server` の `api` を使う。
- 画面コンポーネントは `<Feature><Action>Screen`。Context が要る画面は外側で Provider を巻き、中身は同じファイルの非 export `XxxContent` に書く（例: `RouteCreateScreen.tsx` の `GoogleMapProvider` + `RouteCreateScreenContent`）。
- 新規 component は **named export**（既存の default export は触らない）。ファイル名は `PascalCase.tsx` = コンポーネント名。props 型は **`type XxxProps`**（新規のみ。既存は触らない）。
- component と `hooks/` の画面ロジック hook は **`function` 宣言**、`features/*/api/` の hook は **アロー関数**。
- `src/app` から直接 import される client 境界には **`"use client"` を必ず付ける**。子 component への付与は任意。
- 画面ロジック（送信・遷移・toast・二重送信防止・confirm）は `hooks/use<Feature><Action>` に出し、component は hook の戻り値を並べるだけにする（例: `useRouteCreation` / `useRouteEdit` / `useRouteDeletion`）。
- 再表示で state を捨てたい画面は page 側で `key` を渡す（例: `<RouteEditScreen key={route.id} route={route} />`）。
- 差分は `children` / `panel` などの ReactNode で受ける（例: `RouteScreenLayout` の `panel`、`RouteForm` の `children`）。文言差分はオブジェクト1つで渡す（例: `RouteForm` の `submitText={{ idle, pending }}`）。
- props にデータ取得の hook を渡さない。取得は使う側（画面 or 葉の部品）で `features/*/api` の hook を呼ぶ（例: `PaceSelect` が `usePacesQuery` を内部で呼ぶ）。
- `src/frontend/components/app-ui` の部品は tRPC・feature・業務文言を持たない（例: `WarningBanner`, `StatValue`, `Selectbox`）。
- フォームは react-hook-form + `zodResolver(shared/schemas の schema)`。フォーム値の型は schema から推論する（例: `z.input<typeof userProfileUpdateSchema>`）。
  - 単純なフォームは component 内で `useForm`（例: `InitialProfileForm`, `UserProfileDialog`）。
  - dirty 管理・離脱確認・地点操作など画面ロジックを伴うものは hook に入れる（例: `useRouteDraft`）。
  - 送信ボタンは `disabled={!canSave || isSubmitting}`、ラベルは pending 中に「〜中...」へ切替。
- フィールドエラーは `RouteForm` 方式: `aria-invalid` + `aria-describedby` + `role="alert"`、色は **`text-destructive`**。共通 `FieldError` 部品は作らない。
- 状態表示はテキスト + ARIA: 読み込み中 `<p role="status">…読み込み中...</p>`、エラー `<p role="alert">`、空状態は説明 + 次の行動へのボタン（例: `Dashboard.tsx` のルート一覧）。地図上は `LoadingOverlay`。
- アプリ共通のエラー画面は **`app/not-found.tsx`** と **`app/error.tsx`** を置く方針（実装は別 Issue）。**`loading.tsx` は今は作らない**。

## 2. データ取得とエラー処理

### 取得

- サーバー（RSC）: 画面の初期データは page で取得して **props で渡す**。`HydrateClient` は **prefetch するときだけ** 使う。
  - tRPC 経由: `api` from `~/trpc/server`（例: `api.route.getById`）。
  - 型は `RouterOutputs[...]` から `Pick` する（例: `RouteDetailScreen` の props 型）。
- クライアント: 更新・共有するデータは `features/*/api/useXxxQuery` 経由。戻り値は `{ <名前付きデータ>, isLoading, error }` で、一覧は `?? []`、単体は `?? null`（例: `useRoutesQuery`, `useCurrentUserQuery`）。
- `staleTime: Infinity` を既定にし、鮮度は mutation 側の invalidate で保つ。外部 API 課金系は `retry: false`（例: `useGoogleMapDirectionQuery`）。
- mutation hook 名は **`use<動詞><名詞>`**（例: `useUpdateRoute`）。戻り値は `{ <動詞>, is<動詞ing>, error, reset }`（例: `updateRoute`, `isUpdating`）。`onSuccess` で影響する query を `Promise.all` で invalidate する。
- mutation の結果は **`try { await ... } catch { toast.error(...) }`** で受ける。`executeMutationWithCallbacks` は **新規では使わない**（既存利用の整理は別 Issue）。
- toast の文言は **「。」で終える**。mutation の成否は toast、**query の失敗は inline**（`role="alert"`）。
- 保存・削除後に一覧が RSC 由来の画面へ戻るときは `router.push|replace` の後に `router.refresh()`（例: `useRouteCreation`）。

### エラー

- page: 未ログイン → `redirect("/")`、プロフィール未完了 → `redirect("/setup-profile")`、URL param は Zod で検証し不正なら `notFound()`。
- page での tRPC 呼び出しは `TRPCError` の `NOT_FOUND` だけ `notFound()` に変え、それ以外は再 throw する（404 で隠さない。`app/routes/[id]/page.test.tsx` がこれを検証）。
- router: 所有者条件付きで見つからなければ `NOT_FOUND`、未ログイン `UNAUTHORIZED`（`protectedProcedure`）、クォータ `TOO_MANY_REQUESTS`（`checkQuota`）。
- frontend は `error.data?.code` でだけ分岐し、server の `message` を画面に出さない。ユーザー向け文言は frontend（`features/*/lib`）で決める（例: `getRouteCalculationWarningMessage` が `TOO_MANY_REQUESTS` を上限メッセージに変換）。
- 出し分け: mutation → `toast.success` / `toast.error`（sonner。`Toaster` は `app/layout.tsx`）。query 失敗 → inline。続行可能なら `WarningBanner` で縮退（例: 経路取得失敗時は直線表示）。入力エラー → フィールド直下。
- エラー文言は「〜できませんでした。時間をおいて再度お試しください。」を基本にする。

## 3. 命名とファイル構成

- `components/ui` だけは shadcn 生成の kebab-case（例: `dropdown-menu.tsx`）。
- hook ファイルは `useXxx.ts`。query は `useXxxQuery`、画面ロジック hook は `use<Feature><名詞>`（`useRouteCreation`, `useRouteDraft`）。
- lib: 1関数1ファイル、`camelCase` の動詞始まり（`getRouteMenuLabel.ts`）。汎用の計算群は1ファイルにまとめてよい（`frontend/lib/running.ts`）。
- feature の型は `features/<feature>/types.ts`、Context は `features/<feature>/providers/XxxProvider.tsx`（例: `GoogleMapProvider`、`useGoogleMap` を同ファイルから export）。
- イベント props は `onXxx`（`onTogglePoint`, `onPaceChange`, `onOpenChange`）。boolean は `is/can/show/has` か HTML 属性名（`disabled`）。
- テスト・story は対象と同じディレクトリに `Xxx.test.tsx` / `Xxx.stories.tsx`。page のテストは `page.test.tsx`。
- import は `~/`。同じ feature 内は相対パス（`../api/useCreateRoute`）でもよい（現状 route feature はこの形）。
