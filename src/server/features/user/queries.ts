import "server-only";

import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export function getUserHomePageSettings(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      profileCompletedAt: true,
      homeLat: true,
      homeLng: true,
    },
  });
}
