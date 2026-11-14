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

export async function getCurrentProfile(database: typeof db, userId: string) {
  const user = await database.query.users.findFirst({
    where: eq(users.id, userId),
    columns: profileColumns,
  });
  return user ?? null;
}

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
