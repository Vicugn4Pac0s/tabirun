import "server-only";

import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { getSafeReturnTo } from "~/shared/schemas/auth";

export async function requireUserSession(returnTo: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login?returnTo=${encodeURIComponent(getSafeReturnTo(returnTo))}`,
    );
  }
  return session;
}

export function redirectIfProfileIncomplete(
  user: { profileCompletedAt: Date | null } | undefined,
  returnTo: string,
) {
  if (user && !user.profileCompletedAt) {
    redirect(
      `/setup-profile?returnTo=${encodeURIComponent(getSafeReturnTo(returnTo))}`,
    );
  }
}
