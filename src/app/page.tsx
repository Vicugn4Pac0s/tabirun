import { HydrateClient } from "~/trpc/server";
import { SessionProvider } from 'next-auth/react';
import Providers from "./providers";
import Root from "./Root";

export default async function Home() {

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
