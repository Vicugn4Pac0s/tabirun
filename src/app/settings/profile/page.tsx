import { redirect } from "next/navigation";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { UserProfileEditScreen } from "~/frontend/features/user/components/UserProfileEditScreen";
import { renderProtectedPage } from "~/server/auth/renderProtectedPage";
import { getProfileGender } from "~/server/features/user/profileGender";

export default async function UserProfileEditPage() {
  return renderProtectedPage((_session, user) => {
    if (!user) redirect("/");

    return (
      <main>
        <PageContainer>
          <UserProfileEditScreen
            initialValues={{
              birthDate: user.birthDate ?? undefined,
              gender: getProfileGender(user.gender),
              pace: user.pace ?? undefined,
              height: user.height ?? undefined,
              weight: user.weight ?? undefined,
            }}
          />
        </PageContainer>
      </main>
    );
  });
}
