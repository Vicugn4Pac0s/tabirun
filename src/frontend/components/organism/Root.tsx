'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import MapRoot from "./MapRoot";
import RouteNavigator from "./RouteNavigator";
import StreetViewPanoramaWrapper from "./StreetViewPanoramaWrapper";
import Sidebar from "./Sidebar";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "../ui/dropdown-menu";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full overflow-hidden w-11">
                  <img src={session.user.image || ''} alt="" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>Logout</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => signIn()}>Sign In</Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Root