import MapRoot from "~/frontend/components/organism/MapRoot";
import { RouteNavigator } from "~/frontend/components/organism/RouteNavigator";
import Sidebar from "~/frontend/components/organism/Sidebar";
import StreetViewPanoramaWrapper from "~/frontend/components/organism/StreetViewPanoramaWrapper";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {

  return (
    <HydrateClient>
      <main>
        <div className="flex">
          <div className="w-72">
            <Sidebar />
          </div>
          <div className="flex-1 grid grid-cols-2">
            <div className="relative">
              <StreetViewPanoramaWrapper />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
                <RouteNavigator />
              </div>
            </div>
            <div>
              <MapRoot />
            </div>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
