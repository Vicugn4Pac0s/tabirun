import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";

import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { auth } from "~/server/auth";
import { getUserMapSettings } from "~/server/features/user/queries";
import { HydrateClient } from "~/trpc/server";
import { getDefaultCenter } from "~/app/_lib/getDefaultCenter";
import Root from "./_components/Root";
import Providers from "./providers";

export default async function Home() {
  const session = await auth();

  const user = session?.user?.id
    ? await getUserMapSettings(session.user.id)
    : null;

  if (user && !user.profileCompletedAt) {
    redirect("/setup-profile");
  }

  const defaultCenter = getDefaultCenter(user, GOOGLE_MAP_DEFAULT_CENTER);

  return (
    <HydrateClient>
      <SessionProvider session={session}>
        <main>
          <Providers>
            <Root defaultCenter={defaultCenter} />
          </Providers>
        </main>
      </SessionProvider>
    </HydrateClient>
  );
}
