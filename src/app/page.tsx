import { HydrateClient } from "~/trpc/server";
import { SessionProvider } from 'next-auth/react';
import Providers from "./providers";
import Root from "./_components/Root";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { isUserProfileCompleted } from "~/shared/schemas";

export default async function Home() {
  const session = await auth();

  if (session?.user?.id) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: {
        gender: true,
        pace: true,
        height: true,
        weight: true,
      },
    });

    if (user && !isUserProfileCompleted(user)) {
      redirect("/setup-profile");
    }
  }

  return (
    <HydrateClient>
      <SessionProvider>
        <main>
          <Providers>
            <Root />
          </Providers>
        </main>
      </SessionProvider>
    </HydrateClient>
  );
}
