import { redirect } from "next/navigation";
import { UserProfileEditScreen } from "~/frontend/features/user/components/UserProfileEditScreen";
import { auth } from "~/server/auth";
import { getUserProfileSettings } from "~/server/features/user/queries";

export default async function UserProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const user = await getUserProfileSettings(session.user.id);
  if (!user) redirect("/");
  if (!user.profileCompletedAt) redirect("/setup-profile");

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <UserProfileEditScreen
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
