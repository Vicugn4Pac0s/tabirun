import { HydrateClient } from "~/trpc/server";
import Root from "~/frontend/components/organism/Root";

export default async function Home() {

  return (
    <HydrateClient>
      <main>
        <Root />
      </main>
    </HydrateClient>
  );
}
