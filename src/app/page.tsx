import MapRoot from "~/frontend/components/organism/MapRoot";
import { RouteNavigator } from "~/frontend/components/organism/RouteNavigator";
import StreetViewPanoramaWrapper from "~/frontend/components/organism/StreetViewPanoramaWrapper";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {

  return (
    <HydrateClient>
      <main>
        <div className="flex">
          <div className="relative w-1/2">
            <StreetViewPanoramaWrapper />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
              <RouteNavigator />
            </div>
          </div>
          <div className="w-1/2">
            <MapRoot />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
