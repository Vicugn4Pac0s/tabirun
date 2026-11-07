import { redirect } from "next/navigation";
import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { UserProfileEditScreen } from "~/frontend/features/user/components/UserProfileEditScreen";
import { renderProtectedPage } from "~/server/auth/renderProtectedPage";

export default async function UserProfileEditPage() {
  return renderProtectedPage((_session, user) => {
    if (!user) redirect("/");

    return (
      <main>
        <PageContainer>
          <UserProfileEditScreen
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
  });
}
