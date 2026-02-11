'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import MapRoot from "./MapRoot";
import RouteNavigator from "./RouteNavigator";
import StreetViewPanoramaWrapper from "./StreetViewPanoramaWrapper";
import Sidebar from "./Sidebar";

function Root() {
  const {data: session} = useSession();

  return (
    <div className="flex">
      <div className="w-72">
        <Sidebar />
      </div>
      <div className="flex-1 grid grid-cols-2 relative">
        <div className="relative">
          <StreetViewPanoramaWrapper />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
            <RouteNavigator />
          </div>
        </div>
        <div>
          <MapRoot />
        </div>
        <div className="absolute top-3 right-3 z-50">
          {session?.user ? (
            <button className="rounded-full overflow-hidden h-11 w-11" onClick={() => signOut()}>
              <img src={session.user.image || ''} alt="" />
            </button>
          ) : (
            <button className="text-gray-700 text-5xl align-middle" onClick={() => signIn()}>
              ログイン
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Root