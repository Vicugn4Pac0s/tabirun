import MapWrapper from "~/components/organism/MapWrapper";
import { HydrateClient } from "~/trpc/server";

export default async function Home() {

  return (
    <HydrateClient>
      <main>
        <div className="w-1/2">
          <MapWrapper currentLocation={null}>
            <></>
          </MapWrapper>
        </div>
      </main>
    </HydrateClient>
  );
}
