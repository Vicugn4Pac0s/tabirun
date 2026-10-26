import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { HydrateClient } from "~/trpc/server";
import { Dashboard } from "~/frontend/features/dashboard/components/Dashboard";

export default async function Home() {
  const session = await auth();

  const user = session?.user?.id
    ? await getUserHomePageSettings(session.user.id)
    : null;

  if (user && !user.profileCompletedAt) {
    redirect("/setup-profile");
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
