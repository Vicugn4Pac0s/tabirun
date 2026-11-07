import "server-only";

import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { parseReturnTo } from "~/shared/schemas/auth";

export async function requireUserSession(returnTo: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?returnTo=${encodeURIComponent(parseReturnTo(returnTo))}`);
  }
  return session;
}

export function redirectIfProfileIncomplete(
  user: { profileCompletedAt: Date | null } | undefined,
  returnTo: string,
) {
  if (user && !user.profileCompletedAt) {
    redirect(
      `/setup-profile?returnTo=${encodeURIComponent(parseReturnTo(returnTo))}`,
    );
  }
}
