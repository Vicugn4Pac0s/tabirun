'use client';

import MapRoot from "./MapRoot";
import RouteNavigator from "./RouteNavigator";
import StreetViewPanoramaWrapper from "./StreetViewPanoramaWrapper";
import Sidebar from "./Sidebar";

function Root() {

  return (
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
  )
}

export default Root