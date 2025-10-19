import StreetViewPanorama from "~/components/atoms/googlemap/StreetViewPanorama";
import MapWrapper from "~/components/organism/MapWrapper";
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
            <MapWrapper currentLocation={null}>
              <></>
            </MapWrapper>
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
