import "server-only";

import type { Session } from "next-auth";
import type { ReactNode } from "react";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { LoginScreen } from "~/frontend/features/auth/components/LoginScreen";
import { UserInitialProfileScreen } from "~/frontend/features/user/components/UserInitialProfileScreen";
import { auth } from "~/server/auth";
import { getUserProfileSettings } from "~/server/features/user/queries";

/**
 * 認証・プロフィール状態に応じてログイン画面、初期設定画面、またはrenderの結果を返す。
 * プロフィール行が存在しない場合もrenderへ渡す。redirectは行わない。
 */
export async function renderProtectedPage(
  render: (
    session: Session,
    user: Awaited<ReturnType<typeof getUserProfileSettings>>,
  ) => ReactNode | Promise<ReactNode>,
) {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main>
        <PageContainer>
          <LoginScreen />
        </PageContainer>
      </main>
    );
  }

  const user = await getUserProfileSettings(session.user.id);
  if (user && !user.profileCompletedAt) {
    return (
      <main>
        <PageContainer className="flex min-h-screen items-center">
          <UserInitialProfileScreen
            initialValues={{
              birthDate: user.birthDate ?? undefined,
              gender: user.gender ?? undefined,
              pace: user.pace ?? undefined,
              height: user.height ?? undefined,
              weight: user.weight ?? undefined,
            }}
          />
        </PageContainer>
      </main>
    );
  }

  return render(session, user);
}
