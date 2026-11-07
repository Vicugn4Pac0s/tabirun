import { redirect } from "next/navigation";
import { LoginScreen } from "~/frontend/features/auth/components/LoginScreen";
import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { parseReturnTo } from "~/shared/schemas/auth";

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const returnTo = parseReturnTo((await searchParams).returnTo);
  const session = await auth();
  if (session?.user?.id) {
    const user = await getUserHomePageSettings(session.user.id);
    if (user && !user.profileCompletedAt) {
      redirect(`/setup-profile?returnTo=${encodeURIComponent(returnTo)}`);
    }
    redirect(returnTo);
  }
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10">
      <LoginScreen returnTo={returnTo} />
    </main>
  );
}
