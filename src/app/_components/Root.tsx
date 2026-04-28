"use client";
import Sidebar from "~/frontend/components/layout/Sidebar";
import MapScreen from "./MapScreen";
import { AuthUserMenu } from "~/frontend/features/auth/components/AuthUserMenu";
import SidebarContent from "./sidebar/SidebarContent";

function Root() {
  return (
    <div className="flex">
      <div className="w-72">
        <Sidebar>
          <SidebarContent />
        </Sidebar>
      </div>
      <MapScreen />
      <div className="absolute top-3 right-3 z-50">
        <AuthUserMenu />
      </div>
    </div>
  );
}

export default Root;
