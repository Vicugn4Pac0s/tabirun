import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export function getUserHomePageSettings(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      profileCompletedAt: true,
    },
  });
}

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
