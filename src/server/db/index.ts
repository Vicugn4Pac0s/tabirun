// db:seedから通常のNode.jsでも読み込むため、server-onlyは付けない。
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "~/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  client: postgres.Sql | undefined;
};

/** PostgreSQLの接続クライアントを共有する。非本番では再読み込みによるクライアントの増加を防ぐため再利用する。 */
export const client =
  globalForDb.client ?? postgres(env.DATABASE_URL, { prepare: false });
if (env.NODE_ENV !== "production") globalForDb.client = client;

/** アプリとseedで使う、テーブル定義付きのDrizzle接続を公開する。 */
export const db = drizzle(client, { schema });
