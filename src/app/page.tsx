import MapRoot from "~/components/organism/MapRoot";
import StreetViewPanoramaWrapper from "~/components/organism/StreetViewPanoramaWrapper";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {

  return (
    <HydrateClient>
      <main>
        <div className="flex">
          <div className="w-1/2">
            <StreetViewPanoramaWrapper />
          </div>
          <div className="w-1/2">
            <MapRoot />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
