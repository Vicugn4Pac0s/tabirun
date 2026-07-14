"use client";
import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import SidebarContent from "./sidebar/SidebarContent";
import MobileSidebarSheet from "./sidebar/MobileSidebarSheet";

type RootProps = {
  defaultCenter: google.maps.LatLngLiteral;
};

function Root({ defaultCenter }: RootProps) {
  return (
    <div className="relative flex">
      <div className="hidden w-72 md:block">
        <Sidebar>
          <SidebarContent />
        </Sidebar>
      </div>
      <div className="md:hidden">
        <MobileSidebarSheet>
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

export default Root;
