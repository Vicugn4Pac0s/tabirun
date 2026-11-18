import "server-only";

import type { Session } from "next-auth";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  getUserProfileSettings,
  getProfileFormInitialValues,
} from "~/server/features/user/service";

export type ProtectedPageState =
  | { status: "unauthenticated" }
  | {
      status: "profileRequired";
      initialValues: ReturnType<typeof getProfileFormInitialValues>;
    }
  | {
      status: "ready";
      session: Session;
      user: Awaited<ReturnType<typeof getUserProfileSettings>>;
    };

/**
 * 認証・プロフィール状態を判定し、初期設定が必要ならフォーム初期値も返す。
 * プロフィール行が存在しない場合はreadyとし、画面表示やredirectは行わない。
 */
export async function getProtectedPageState(): Promise<ProtectedPageState> {
  const session = await auth();
  if (!session?.user?.id) return { status: "unauthenticated" };

  const user = await getUserProfileSettings(db, session.user.id);
  if (user && !user.profileCompletedAt) {
    return {
      status: "profileRequired",
      initialValues: getProfileFormInitialValues(user),
    };
  }
  return { status: "ready", session, user };
}
