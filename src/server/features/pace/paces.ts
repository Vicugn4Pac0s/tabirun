import "server-only";

import type { db } from "~/server/db";
import { paces } from "~/server/db/schema";

/** 公開マスターのペース一覧を返す。登録がなければ空配列を返す。 */
export async function getPaces(database: Pick<typeof db, "select">) {
  return database.select().from(paces);
}
