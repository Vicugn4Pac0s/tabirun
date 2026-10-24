"use client";

import Link from "next/link";
import { useRouteDiscardGuard } from "~/frontend/features/route/hooks/useRouteDiscardGuard";
import { MapWorkspaceLayout } from "~/frontend/features/googlemap/components/MapWorkspaceLayout";
import MapScreen from "./MapScreen";
import SidebarContent from "./sidebar/SidebarContent";
import MobileSidebarTrigger from "./sidebar/MobileSidebarTrigger";

type MapWorkspaceProps = {
  defaultCenter: google.maps.LatLngLiteral;
};

function MapWorkspace({ defaultCenter }: MapWorkspaceProps) {
  const { confirmDiscard } = useRouteDiscardGuard();
  return (
    <MapWorkspaceLayout
      sidebar={
        <>
          <Link
            href="/"
            className="mb-5 inline-block font-medium underline"
            onClick={(event) => {
              if (!confirmDiscard()) event.preventDefault();
            }}
          >
            ホームへ戻る
          </Link>
          <SidebarContent />
        </>
      }
      mobileTrigger={<MobileSidebarTrigger />}
    >
      <MapScreen defaultCenter={defaultCenter} />
    </MapWorkspaceLayout>
  );
}
export default MapWorkspace;
