import { redirect } from "next/navigation";

import { PageContainer } from "~/frontend/components/app-ui/PageContainer";
import { Login } from "~/frontend/features/auth/screens/Login";
import { UserInitialProfile } from "~/frontend/features/user/screens/UserInitialProfile";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  getUserProfileSettings,
  getProfileFormInitialValues,
} from "~/server/features/user/service";

export default async function SetupProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main>
        <PageContainer>
          <Login />
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
        <UserInitialProfile initialValues={getProfileFormInitialValues(user)} />
      </PageContainer>
    </main>
  );
}
