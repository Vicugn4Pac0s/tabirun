"use client";
import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import SidebarContent from "./sidebar/SidebarContent";
import MobileSidebarSheet from "./sidebar/MobileSidebarSheet";

function Root() {
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
      <MapScreen />
      <div className="absolute top-3 right-3 z-50">
        <AuthUserMenu />
      </div>
    </div>
  );
}

export default Root;
