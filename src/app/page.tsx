import { HydrateClient } from "~/trpc/server";
import { SessionProvider } from "next-auth/react";
import Providers from "./providers";
import Root from "./_components/Root";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { getDefaultCenter } from "~/app/_lib/getDefaultCenter";

export default async function Home() {
  const session = await auth();

  const user = session?.user?.id
    ? await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: {
          profileCompletedAt: true,
          homeLat: true,
          homeLng: true,
        },
      })
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
