"use client";
import Link from "next/link";
import { useRouteDiscardGuard } from "~/frontend/features/route/hooks/useRouteDiscardGuard";
import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import SidebarContent from "./sidebar/SidebarContent";
import MobileSidebarSheet from "./sidebar/MobileSidebarSheet";

type MapWorkspaceProps = {
  defaultCenter: google.maps.LatLngLiteral;
};

function MapWorkspace({ defaultCenter }: MapWorkspaceProps) {
  const { confirmDiscard } = useRouteDiscardGuard();
  return (
    <div className="relative flex">
      <div className="hidden w-72 md:block">
        <Sidebar>
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
        </Sidebar>
      </div>
      <div className="md:hidden">
        <MobileSidebarSheet>
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
        </MobileSidebarSheet>
      </div>
      <MapScreen defaultCenter={defaultCenter} />
      <div className="absolute right-3 top-3 z-50">
        <AuthUserMenu />
      </div>
    </div>
  );
}

export default MapWorkspace;
