# Backend Guide

`AGENTS.md` の補足。共通化の量より、読んで処理の順序・所有者条件・副作用が分かることを優先する。MVCの名前やフォルダには揃えず、機能ごとに責務を分ける。

featureは配置の単位、DDDは業務の概念や境界を考えるための考え方で、両立する。業務の言葉で命名しルールを分離する考えは採用するが、DDD一式やEntityクラス、層を増やすための仕組みは導入しない。

このガイドは今後の追加・変更に適用する。プロフィールの読み書きは `features/user`、ルートの操作・DBアクセスは `features/route`、Googleとの通信は `features/direction` に配置している。ガイドを根拠に依頼範囲外の既存コードを移動・整理しない。

## 1. routerは入口にする

- routerには入力schema、認証・クォータ用procedureの選択、操作関数の呼び出しを書く。
- 入力制約は `shared/schemas` を使う。操作関数へ `ctx` 全体は渡さず、必要な `db`・セッション由来のユーザーID・入力を渡す。
- Zod schemaの変数名は camelCase + `Schema`（例: `routeCreateDraftSchema`）、推論型は PascalCase（例: `RouteCreateDraftInput`）にする。入力schemaは `src/shared/schemas`、サーバーだけで使う出力・外部APIレスポンスのschemaは利用側の `src/server/features/<feature>/` に置く。
- routerの認証と、対象データへの所有者条件は別の責務として扱う。

## 2. 操作の流れを1つの関数にまとめる

- `updateRoutePoints`、`getRouteDetail` のように、目的が伝わる関数を入口にする。DB操作や外部通信を実行する順序をここで読めるようにする。
- トランザクションは操作関数で開始し、その中のDB関数には同じ `tx` を渡す。内部で別の接続・トランザクションを作らない。
- 行ロックが必要な操作では、最初に所有者条件付きで取得した行を使い、処理の終了までロックを保持する。
- 操作ごとに必ず複数の層やファイルを作る、という意味ではない。小さく読みやすい処理まで機械的に分割しない。

## 3. 判断・組み立ては純粋関数にする

- hash計算、経路の期限・再利用判定、直線結果の組み立てなど、DB・通信を必要としない処理を分ける。必要な時刻は `now` として渡す。
- 既存の `getReusableRouteDirection(saved, points, now)` がこの例。短くその場で分かる処理まで、名前を増やすためだけに抽出しない。
- 残数確認はDB処理、確認後に直線へ分岐するのは操作の流れ、直線データの組み立ては純粋関数、と責務を分ける。

## 4. DB操作と行の変換に名前を付ける

- `findOwnedRouteForUpdate`、`updateOwnedRoute`、`saveOwnedRouteDirection` のように、対象・所有者制約・ロックの有無が伝わる名前を使う。
- `toRoute(row)` はDB操作ではなく、DBの行からアプリ用データへの変換。地点JSONの `JSON.parse` と `routePointsSchema.parse` をここで行う。
- 一覧などに必要な列だけを取得し、取得していない地点や経路まで変換しない。異なる読み書きを汎用の `execute` やオプション分岐にまとめない。

## 5. 所有者条件はDB操作で保証する

- 操作関数は信頼できるセッション由来のユーザーIDを渡し、DB関数がSQLの条件を組み立てる。入力のユーザーIDを所有者として信用しない。
- ルート1件の取得・更新・削除は、IDと所有者IDの両方で絞る。事前取得で所有者を確認していても、更新・削除の条件から所有者を外さない。
- 一覧は所有者ID、ユーザー本人の設定はユーザーIDで絞る。公開マスターなど所有者を持たないデータに、機械的に所有者条件を足さない。
- 所有ルートが見つからなければ `NOT_FOUND`。更新・削除0件も操作関数で `NOT_FOUND` にする。他人のデータの存在を区別して返さない。
- routerだけでの事前確認は別の呼び出し元を守れず、操作関数ごとのSQL記述は条件が散らばる。所有者付きDB関数に置き、関数名だけでなくSQL条件と認可テストで確認する。

## 6. 判定は値、処理の失敗は例外で表す

| 場面                           | 表現                                      |
| ------------------------------ | ----------------------------------------- |
| 残数があるか                   | `hasQuotaRemaining` のboolean             |
| 再利用できる経路があるか       | 経路または `null`                         |
| 所有ルートなし・更新0件        | `TRPCError` の `NOT_FOUND`                |
| 上限ならAPIを中断する          | 既存 `checkQuota` の `TOO_MANY_REQUESTS`  |
| DB障害                         | 例外を伝播                                |
| 外部通信に失敗しても継続できる | 通信部分だけcatchし、既存の縮退処理へ進む |

`TRPCError` をcatchして通常の判定に戻す書き方は避ける。業務処理で既存の `TRPCError` を使ってよいが、routerやtRPC contextには依存しない。エラーcodeを維持し、serverのmessageを画面表示する前提にしない。

外部通信のcatchにDB操作まで含めず、DB障害を経路取得の失敗や上限到達として扱わない。課金APIの送信後の計上条件は各呼び出し側の既存仕様を維持する。残数確認は利用枠の予約ではなく、加算が呼出側トランザクションに含まれる場合はrollbackで戻る。

## 7. サーバー専用の処理をfeatureごとに置く

```text
server/api/routers/                 入力・認証・呼び出し
server/features/route/
  service.ts                       操作・トランザクション・経路の再利用と保存
  repository.ts                    所有者条件付きDB操作・行の変換
server/features/direction/
  service.ts                       経路取得と利用回数の計上
  domain.ts                        hash・期限・再利用判定・保存用経路の組み立て
  client.ts                        Googleへの通信・応答検証・経路復元
server/features/user/
  service.ts                       プロフィールの読み取り・更新
  domain.ts                        保存済みの性別をフォーム用に検証
server/features/pace/service.ts     公開ペース一覧の取得
server/quota/                      利用枠の確認・計上
server/auth/                       認証
server/db/                         接続・schema
```

- `server/features` は読み取りに限定せず、サーバー専用の業務処理・DB操作・外部通信を置く。サーバー専用モジュールには `import "server-only"` を付ける。
- feature内のファイル名は `service.ts`、`repository.ts`、`domain.ts`、`client.ts`、`constants.ts` と対応する `*.test.ts` に揃える。必要なものだけ作り、長くなった場合は同名のディレクトリに分けてよい。
- `service.ts` は操作の順序・トランザクション・エラー判定を担当する。小さいfeatureのDB処理や、副作用のない読み取りも同じファイルに置いてよい。
- `repository.ts` は所有者条件付きDB処理・行の変換を担当する。現在はロックや複数のDB操作を持つ `route` で分けており、全featureに機械的に作らない。
- `domain.ts` は判断・計算・組み立ての純粋関数を置き、DB・client・tRPC context・環境変数に依存させない。入力の形や制約を表すschemaは `shared/schemas` に定義し、domainでは参照して使う。
- `client.ts` は外部APIとの通信と応答検証を担当する。外部APIレスポンスのschemaもここに置く。
- `constants.ts` はfeature内の複数ファイルで共有する定数を置く。ファイル内だけで使う定数はそのファイルに置く。
- アプリ用のDB入口 `server/db/index.ts` には `import "server-only"` を付ける。接続クライアントとDrizzle接続の作成は `server/db/connection.ts` に置き、`index.ts` は同じ `client` と `db` を再exportする。接続は `prepare: false` とし、非本番では `globalThis` のクライアントを再利用して接続を二重に作らない。`db:seed` は通常のNode.js（tsx）で動くため `connection.ts` を直接読み、`connection.ts` には `server-only` を付けない。アプリのimportは `~/server/db` のままにする。frontendからの値のimportは禁止する。
- RSCから呼ぶ読み取りも `server-only` で守る。pageはfeatureの読み取り関数か `~/trpc/server` のAPIを使い、DBを直接操作しない。
- queryという名前だけで読み取り専用と判断しない。現在の `route.getById` は経路キャッシュを書き戻すことがあり、`getRouteDetail` のような操作として扱う。
- 依存は原則 `router → features → DB／quota／外部通信`。サーバーfeature間は `route → direction` の一方向に保ち、directionからrouteの保存処理を呼ばない。
- 保存ルートの所有者確認・経路再利用・残数による分岐・保存をまとめる `ensureRouteDirection` は `route/service.ts` に置く。経路取得と利用回数の計上は `direction/service.ts` に集約する。
- `getDirection` は計算失敗を例外で返し、`tryGetDirection` は計算失敗を `null` で返す。利用回数の計上に失敗した場合は、どちらもDB障害を伝播させる。残数確認は呼び出し側が担当する。
- `server` から `frontend` をimportしない。保護ページは `server/auth/getProtectedPageState.ts` が状態だけを返し、pageが状態を確認し、未ログイン・初期設定前なら `app/_components/ProtectedPageFallback.tsx` を返す。準備完了時だけpage内でデータ取得と通常画面の描画へ進む。
- `auth`・`quota`・`db` は共通の仕組みとして残し、業務処理は関連するfeature内に置く。
- 空の層は作らず、小さい処理は同じファイルに置いてよい。このガイドだけを根拠に依頼範囲外の配置変更をしない。

## 8. 導入しないもの

Repositoryのinterface、DIの仕組み、基底クラス、Result型、無理なジェネリクスは導入しない。普通の関数と既存の `db`・`tx` の引数で構成する。汎用化や層の数より、その操作で何をするかが素直に読めることを優先する。

## 例: 地点更新の責務分離

[route router](../src/server/api/routers/route.ts) の `updatePoints` は、入力検証と認証の後に操作関数を呼ぶ。名前更新は `updateDetails` に分け、地点更新では名前・作成状況を変更しない。

```ts
// api/routers/route.ts
updatePoints: protectedProcedure
  .input(routeUpdatePointsSchema)
  .mutation(({ ctx, input }) =>
    updateRoutePoints(ctx.db, ctx.session.user.id, input),
  ),
```

操作関数は所有者条件付きで行ロックを取り、地点が変わった場合にだけキャッシュを無効化・再計算する。以下は現在の実装からの抜粋で、importとJSDocは省略している。

```ts
// features/route/service.ts
export async function updateRoutePoints(
  database: typeof db,
  userId: string,
  input: RouteUpdatePointsInput,
): Promise<void> {
  await database.transaction(async (tx) => {
    const row = await findOwnedRouteForUpdate(tx, userId, input.id);
    if (!row) throw new TRPCError({ code: "NOT_FOUND" });
    const existing = toRoute(row);
    if (
      getRoutePointsHash(existing.points) === getRoutePointsHash(input.points)
    )
      return;
    const changes = {
      points: JSON.stringify(input.points),
      updatedAt: new Date(),
      ...CLEARED_DIRECTION,
    };
    const updated = await updateOwnedRoute(tx, userId, input.id, changes);
    if (updated.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
    await ensureRouteDirection(tx, userId, {
      ...existing,
      ...changes,
      points: input.points,
    });
  });
}
```

DB関数は所有者条件やロックを名前だけにせず、SQLでも保証する。例えば `findOwnedRouteForUpdate` は次の形にする。

```ts
// features/route/repository.ts
export async function findOwnedRouteForUpdate(
  tx: Pick<typeof db, "select">,
  userId: string,
  id: number,
) {
  const [row] = await tx
    .select()
    .from(routes)
    .where(and(eq(routes.id, id), eq(routes.createdById, userId)))
    .for("update");
  return row;
}
```

`updateOwnedRoute` も同じID・所有者条件で更新し、`.returning({ id: routes.id })` で更新した行のIDを配列で返す。操作関数は配列の長さが0なら `NOT_FOUND` にする。`saveOwnedRouteDirection` も同様に所有者付きで更新する。取得済みだからという理由で、更新をIDだけの条件にしない。

```ts
// updateOwnedRoute内の更新。changesは操作関数で組み立てた変更値。
return tx
  .update(routes)
  .set(changes)
  .where(and(eq(routes.id, id), eq(routes.createdById, userId)))
  .returning({ id: routes.id });
```

`toRoute` は地点JSONのparse・Zod検証を行い、`CLEARED_DIRECTION` は既存の経路保存6列を `null` にする定数とする。操作関数が同じ `tx` と取得行を使い続けることで、ロックとトランザクション境界を保つ。

`ensureRouteDirection` の外部通信中も同じトランザクションの行ロックを保持する現状を維持する。同じルートを同時に開いたとき、後続処理が最新の保存済み経路を再利用できるようにし、経路の二重計算・利用回数の二重計上を防ぐためである。その代わり、Googleへの通信中（タイムアウトは最大10秒）は、同じルートで行ロックを必要とする操作が待たされる。現在は外部通信の前後でロックを分割しない。

現在の実装では、タイトルだけの変更では再計算しない。地点変更では旧経路を無効化し、Googleの計算が失敗しても変更地点は保存する。DB障害は伝播してrollbackする。戻り値、クォータ計上、キャッシュ更新による更新日の扱いも変えない。

検証は [AGENTS.mdのテスト節](../AGENTS.md#テスト) に従い、純粋関数・DB競合など各層固有のリスクを検証する。
