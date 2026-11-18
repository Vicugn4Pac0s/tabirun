import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { LoginScreen } from "~/frontend/features/auth/components/LoginScreen";
import { UserInitialProfileScreen } from "~/frontend/features/user/components/UserInitialProfileScreen";
import type { getProtectedPageState } from "~/server/auth/getProtectedPageState";

type ProtectedPageState = Awaited<ReturnType<typeof getProtectedPageState>>;
type ProtectedPageFallbackProps = {
  state: Exclude<ProtectedPageState, { status: "ready" }>;
};

/** ページの認証・初期設定が必要な状態に対応する案内画面を表示する。 */
export function ProtectedPageFallback({ state }: ProtectedPageFallbackProps) {
  if (state.status === "unauthenticated") {
    return (
      <main>
        <PageContainer>
          <LoginScreen />
        </PageContainer>
      </main>
    );
  }
  return (
    <main>
      <PageContainer className="flex min-h-screen items-center">
        <UserInitialProfileScreen initialValues={state.initialValues} />
      </PageContainer>
    </main>
  );
}
