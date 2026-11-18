import { redirect } from "next/navigation";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { UserProfileEditScreen } from "~/frontend/features/user/components/UserProfileEditScreen";
import { renderProtectedPage } from "~/app/_lib/renderProtectedPage";
import { getProtectedPageState } from "~/server/auth/getProtectedPageState";
import { getProfileFormInitialValues } from "~/server/features/user/service";

export default async function UserProfileEditPage() {
  return renderProtectedPage(await getProtectedPageState(), ({ user }) => {
    if (!user) redirect("/");

    return (
      <main>
        <PageContainer>
          <UserProfileEditScreen
            initialValues={getProfileFormInitialValues(user)}
          />
        </PageContainer>
      </main>
    );
  });
}
