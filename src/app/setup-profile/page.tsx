import { parseReturnTo } from "~/shared/schemas/auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { UserInitialProfileScreen } from "~/frontend/features/user/components/UserInitialProfileScreen";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

type SetupProfilePageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function SetupProfilePage({
  searchParams,
}: SetupProfilePageProps) {
  const returnTo = parseReturnTo((await searchParams).returnTo);
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
      profileCompletedAt: true,
      birthDate: true,
      gender: true,
      pace: true,
      height: true,
      weight: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  if (user.profileCompletedAt) {
    redirect(returnTo);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <UserInitialProfileScreen
        returnTo={returnTo}
        initialValues={{
          birthDate: user.birthDate ?? undefined,
          gender: user.gender ?? undefined,
          pace: user.pace ?? undefined,
          height: user.height ?? undefined,
          weight: user.weight ?? undefined,
        }}
      />
    </main>
  );
}
