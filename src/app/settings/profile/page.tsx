import { redirect } from "next/navigation";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { UserProfileEditScreen } from "~/frontend/features/user/components/UserProfileEditScreen";
import { ProtectedPageFallback } from "~/app/_components/ProtectedPageFallback";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";
import { getProfileFormInitialValues } from "~/server/features/user/service";

export default async function UserProfileEditPage() {
  const state = await getProtectedPageState();
  if (state.status !== "ready") {
    return <ProtectedPageFallback state={state} />;
  }
  if (!state.user) redirect("/");

  return (
    <main>
      <PageContainer>
        <UserProfileEditScreen
          initialValues={getProfileFormInitialValues(state.user)}
        />
      </PageContainer>
    </main>
  );
}
