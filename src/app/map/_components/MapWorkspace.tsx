"use client";

import Link from "next/link";
import { useRouteDiscardGuard } from "~/frontend/features/route/hooks/useRouteDiscardGuard";
import { SidebarLayout } from "~/frontend/components/layout/SidebarLayout";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import MapScreen from "./MapScreen";
import SidebarContent from "./sidebar/SidebarContent";
import MapMenuButton from "./sidebar/MapMenuButton";

type MapWorkspaceProps = {
  defaultCenter: google.maps.LatLngLiteral;
};

function MapWorkspace({ defaultCenter }: MapWorkspaceProps) {
  const { confirmDiscard } = useRouteDiscardGuard();
  return (
    <SidebarLayout
      sidebarTitle="ルート情報"
      topRight={<AuthUserMenu />}
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
      mobileTrigger={<MapMenuButton />}
    >
      <MapScreen defaultCenter={defaultCenter} />
    </SidebarLayout>
  );
}
export default MapWorkspace;
