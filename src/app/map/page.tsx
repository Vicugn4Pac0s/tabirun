import { SessionProvider } from "next-auth/react";
import { redirect } from "next/navigation";

import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { auth } from "~/server/auth";
import { getUserHomePageSettings } from "~/server/features/user/queries";
import { HydrateClient } from "~/trpc/server";
import { getDefaultCenter } from "./_lib/getDefaultCenter";
import MapWorkspace from "./_components/MapWorkspace";
import { GoogleMapProvider } from "~/frontend/features/googlemap/providers/GoogleMapProvider";

export default async function MapPage() {
  const session = await auth();

  const user = session?.user?.id
    ? await getUserHomePageSettings(session.user.id)
    : null;

  if (user && !user.profileCompletedAt) {
    redirect("/setup-profile");
  }

  const defaultCenter = getDefaultCenter(user, GOOGLE_MAP_DEFAULT_CENTER);

  return (
    <HydrateClient>
      <SessionProvider session={session}>
        <main>
          <GoogleMapProvider>
            <MapWorkspace defaultCenter={defaultCenter} />
          </GoogleMapProvider>
        </main>
      </SessionProvider>
    </HydrateClient>
  );
}
