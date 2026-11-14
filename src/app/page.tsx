import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { api, HydrateClient } from "~/trpc/server";
import { Dashboard } from "~/frontend/features/dashboard/components/Dashboard";

export default async function Home() {
  const session = await auth();

  const user = session?.user?.id
    ? await getUserHomePageSettings(session.user.id)
    : null;

  if (user && !user.profileCompletedAt) {
    redirect("/setup-profile");
  }

  if (session?.user?.id) {
    await Promise.all([
      api.user.getCurrent.prefetch(),
      api.route.getByUser.prefetch(),
    ]);
  }

  return (
    <HydrateClient>
      <SessionProvider session={session}>
        <main>
          <Dashboard />
        </main>
      </SessionProvider>
    </HydrateClient>
  );
}
