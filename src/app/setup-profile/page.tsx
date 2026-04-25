import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { InitialProfileForm } from "~/frontend/features/user/components/InitialProfileForm";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import {
  isUserProfileCompleted,
  UNSET_BIRTH_DATE_VALUE,
  UNSET_PROFILE_VALUE,
} from "~/shared/schemas";

export default async function SetupProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: {
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

  if (isUserProfileCompleted(user)) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg items-center px-4 py-10">
      <section className="w-full space-y-6 rounded-xl border bg-white p-6 shadow-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">初期設定</h1>
          <p className="text-sm text-muted-foreground">
            TABIRUNを利用するためにプロフィールを設定してください。
          </p>
        </header>

        <InitialProfileForm
          initialValues={{
            birthDate:
              user.birthDate === UNSET_BIRTH_DATE_VALUE
                ? undefined
                : user.birthDate,
            gender: user.gender === UNSET_PROFILE_VALUE ? undefined : user.gender,
            pace: user.pace === UNSET_PROFILE_VALUE ? undefined : user.pace,
            height: user.height > 0 ? user.height : undefined,
            weight: user.weight > 0 ? user.weight : undefined,
          }}
        />
      </section>
    </main>
  );
}
