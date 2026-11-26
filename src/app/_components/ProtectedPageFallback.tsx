import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { Login } from "~/frontend/features/auth/screens/Login";
import { UserInitialProfile } from "~/frontend/features/user/screens/UserInitialProfile";
import type { ProtectedPageState } from "~/server/auth/getProtectedPageState";

type ProtectedPageFallbackProps = {
  state: Exclude<ProtectedPageState, { status: "ready" }>;
};

/** ページの認証・初期設定が必要な状態に対応する案内画面を表示する。 */
export function ProtectedPageFallback({ state }: ProtectedPageFallbackProps) {
  if (state.status === "unauthenticated") {
    return (
      <main>
        <PageContainer>
          <Login />
        </PageContainer>
      </main>
    );
  }
  return (
    <main>
      <PageContainer className="flex min-h-screen items-center">
        <UserInitialProfile initialValues={state.initialValues} />
      </PageContainer>
    </main>
  );
}
