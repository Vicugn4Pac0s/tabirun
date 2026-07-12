import { relations } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  primaryKey,
  pgTableCreator,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `tabirun_${name}`);

export const routes = createTable(
  "route",
  {
    id: serial("id").primaryKey(),
    title: varchar("title", { length: 256 }),
    points: text("points").notNull(),
    createdById: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
      () => new Date(),
    ),
  },
  (route) => [
    index("created_by_idx").on(route.createdById),
    index("title_idx").on(route.title),
  ],
);

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }).defaultNow(),
  image: varchar("image", { length: 255 }),
  birthDate: varchar("birth_date", { length: 10 }),
  gender: varchar("gender", { length: 50 }),
  pace: varchar("pace", { length: 255 }),
  height: integer("height"),
  weight: integer("weight"),
  homeLat: doublePrecision("home_lat"),
  homeLng: doublePrecision("home_lng"),
  profileCompletedAt: timestamp("profile_completed_at", { mode: "date" }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => [
    primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    index("account_user_id_idx").on(account.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("userId", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (session) => [index("session_userId_idx").on(session.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const paces = createTable("pace", {
  id: serial("id").primaryKey(),
  value: varchar("value", { length: 255 }).notNull(),
});

export const quotaUsages = createTable(
  "quota_usage",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    feature: varchar("feature", { length: 255 }).notNull(),
    date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
    count: integer("count").notNull().default(0),
  },
  (t) => [index("quota_user_feature_date_idx").on(t.userId, t.feature, t.date)],
);
