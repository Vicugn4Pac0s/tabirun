import { redirect } from "next/navigation";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { UserProfileEditScreen } from "~/frontend/features/user/components/UserProfileEditScreen";
import { renderProtectedPage } from "~/server/auth/renderProtectedPage";
import { getProfileFormInitialValues } from "~/server/features/user/profile";

export default async function UserProfileEditPage() {
  return renderProtectedPage((_session, user) => {
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
