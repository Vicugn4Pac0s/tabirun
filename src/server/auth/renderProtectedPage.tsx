import "server-only";

import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { LoginScreen } from "~/frontend/features/auth/components/LoginScreen";
import { UserInitialProfileScreen } from "~/frontend/features/user/components/UserInitialProfileScreen";
import { auth } from "~/server/auth";
import { getUserProfileSettings } from "~/server/features/user/queries";

export async function renderProtectedPage(
  render: (
    session: Session,
    user: Awaited<ReturnType<typeof getUserProfileSettings>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <LoginScreen />
      </main>
    );
  }

  const user = await getUserProfileSettings(session.user.id);
  if (user && !user.profileCompletedAt) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
        <UserInitialProfileScreen
          initialValues={{
            birthDate: user.birthDate ?? undefined,
            gender: user.gender ?? undefined,
            pace: user.pace ?? undefined,
            height: user.height ?? undefined,
            weight: user.weight ?? undefined,
          }}
        />
      </main>
    );
  }

  return render(session, user);
}
