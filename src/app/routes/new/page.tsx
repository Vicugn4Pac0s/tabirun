import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { RouteCreateScreen } from "~/frontend/features/route/components/RouteCreateScreen";
import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";

export default async function RouteCreatePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const user = await getUserHomePageSettings(session.user.id);
  if (user && !user.profileCompletedAt) redirect("/setup-profile");
  return (
    <SessionProvider session={session}>
      <main>
        <RouteCreateScreen defaultCenter={GOOGLE_MAP_DEFAULT_CENTER} />
      </main>
    </SessionProvider>
  );
}
