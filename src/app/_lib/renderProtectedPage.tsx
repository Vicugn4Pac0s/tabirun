import type { ReactNode } from "react";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { LoginScreen } from "~/frontend/features/auth/components/LoginScreen";
import { UserInitialProfileScreen } from "~/frontend/features/user/components/UserInitialProfileScreen";
import type { getProtectedPageState } from "~/server/auth/getProtectedPageState";

type ProtectedPageState = Awaited<ReturnType<typeof getProtectedPageState>>;
/** 状態に応じて認証案内・初期設定を表示し、準備完了時だけrenderを評価する。 */
export function renderProtectedPage(
  state: ProtectedPageState,
  render: (
    state: Extract<ProtectedPageState, { status: "ready" }>,
  ) => ReactNode | Promise<ReactNode>,
) {
  if (state.status === "unauthenticated") {
    return (
      <main>
        <PageContainer>
          <LoginScreen />
        </PageContainer>
      </main>
    );
  }
  if (state.status === "profileRequired") {
    return (
      <main>
        <PageContainer className="flex min-h-screen items-center">
          <UserInitialProfileScreen initialValues={state.initialValues} />
        </PageContainer>
      </main>
    );
  }
  return render(state);
}
