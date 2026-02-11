import { HydrateClient } from "~/trpc/server";
import { SessionProvider } from 'next-auth/react';
import Root from "~/frontend/components/organism/Root";

export default async function Home() {

  return (
    <HydrateClient>
      <SessionProvider>
        <main>
          <Root />
        </main>
      </SessionProvider>
    </HydrateClient>
  );
}
