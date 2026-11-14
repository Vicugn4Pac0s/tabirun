import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

/**
 * ホーム表示に必要なプロフィール完了状態を読み取り、対象なしならundefinedを返す。
 * 認証・画面の出し分けは呼出側で行い、DB障害は伝播する。
 */
export function getUserHomePageSettings(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      profileCompletedAt: true,
    },
  });
}

/**
 * プロフィール画面に必要な設定を読み取り、対象なしならundefinedを返す。
 * 認証・画面の出し分けは呼出側で行い、DB障害は伝播する。
 */
export function getUserProfileSettings(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      profileCompletedAt: true,
      birthDate: true,
      gender: true,
      pace: true,
      height: true,
      weight: true,
    },
  });
}
