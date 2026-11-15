import { redirect } from "next/navigation";

import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { LoginScreen } from "~/frontend/features/auth/components/LoginScreen";
import { UserInitialProfileScreen } from "~/frontend/features/user/components/UserInitialProfileScreen";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getUserProfileSettings } from "~/server/features/user/profile";
import { getProfileGender } from "~/server/features/user/profileGender";

export default async function SetupProfilePage() {
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

  const user = await getUserProfileSettings(db, session.user.id);

  if (!user) {
    redirect("/");
  }

  if (user.profileCompletedAt) {
    redirect("/");
  }

  return (
    <main>
      <PageContainer className="flex min-h-screen items-center">
        <UserInitialProfileScreen
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
}
