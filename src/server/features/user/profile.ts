import "server-only";

import { eq } from "drizzle-orm";

import type { db } from "~/server/db";
import { users } from "~/server/db/schema";
import type {
  UserInitialProfileInput,
  UserProfileUpdateInput,
} from "~/shared/schemas";

const profileColumns = {
  id: true,
  name: true,
  email: true,
  image: true,
  birthDate: true,
  gender: true,
  pace: true,
  height: true,
  weight: true,
  profileCompletedAt: true,
} as const;

/**
 * 指定ユーザーのプロフィールを返し、見つからなければnullを返す。DB障害は伝播する。
 */
export async function getCurrentProfile(database: typeof db, userId: string) {
  const user = await database.query.users.findFirst({
    where: eq(users.id, userId),
    columns: profileColumns,
  });
  return user ?? null;
}

/**
 * 指定ユーザーのプロフィールを更新して再取得し、見つからなければundefinedを返す。
 * 未指定の項目は更新しない。更新と取得は独自のトランザクションで囲まず、DB障害は伝播する。
 */
export async function updateProfile(
  database: typeof db,
  userId: string,
  input: UserProfileUpdateInput,
) {
  await database
    .update(users)
    // undefinedの項目はDrizzleがSQLから除外するため、未指定の項目は更新されない。
    .set({
      birthDate: input.birthDate,
      gender: input.gender,
      pace: input.pace,
      height: input.height,
      weight: input.weight,
    })
    .where(eq(users.id, userId));

  return database.query.users.findFirst({
    where: eq(users.id, userId),
    columns: profileColumns,
  });
}

/**
 * 初期プロフィールと完了時刻を保存して再取得し、見つからなければundefinedを返す。
 * 再実行すると完了時刻も更新する。更新と取得は独自のトランザクションで囲まず、DB障害は伝播する。
 */
export async function completeInitialProfile(
  database: typeof db,
  userId: string,
  input: UserInitialProfileInput,
) {
  await database
    .update(users)
    .set({
      birthDate: input.birthDate,
      gender: input.gender,
      pace: input.pace,
      height: input.height,
      weight: input.weight,
      profileCompletedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return database.query.users.findFirst({
    where: eq(users.id, userId),
    columns: profileColumns,
  });
}
