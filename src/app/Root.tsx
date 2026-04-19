'use client';

import { GOOGLE_MAP_DEFAULT_CENTER, GOOGLE_MAP_DEFAULT_ZOOM, GOOGLE_MAP_MAX_ZOOM, GOOGLE_MAP_MIN_ZOOM } from "~/frontend/config";
import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { useGoogleMap } from "~/frontend/features/googlemap/providers/GoogleMapProvider";
import { useMoveStreetView } from "~/frontend/features/googlemap/hooks/useMoveStreetView";
import { useRoutePointsStore } from "~/frontend/features/route-points/stores/routePointsStore";
import GoogleMapView from "~/frontend/features/googlemap/components/GoogleMapView";
import StreetView from "~/frontend/features/googlemap/components/StreetView";
import RouteNavigation from "~/frontend/features/route-navigation/components/RouteNavigation";
import RoutePointMarker from "~/frontend/features/googlemap/components/RoutePointMarker";

function Root() {
  const {data: session} = useSession();
  const {map, setMap, streetView} = useGoogleMap();
  const moveStreetView = useMoveStreetView();
  const [streetViewCenter, setStreetViewCenter] = useState<google.maps.LatLngLiteral | null>(null);
  const [streetViewPov, setStreetViewPov] = useState<google.maps.StreetViewPov | null>(null);
  const routePoints = useRoutePointsStore((state) => state.routePoints);

  return (
    <div className="flex-1 grid grid-cols-2 relative">
      <div className="relative">
        <StreetView
          map={map}
          streetView={streetView}

          options={{
            position: GOOGLE_MAP_DEFAULT_CENTER,
            pov: { heading: 165, pitch: 0 },
            zoomControl: false,
            addressControl: false,
            motionTrackingControl: false,
          }}
          onPositionChanged={(position) => {
            const positionLatLngLiteral = position.toJSON() as google.maps.LatLngLiteral;
            setStreetViewCenter(positionLatLngLiteral);
          }}
          onPovChanged={(pov) => {
            setStreetViewPov(pov);
          }}
        />   
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-10">
          {streetViewCenter && <RouteNavigation currentPoint={streetViewCenter} />}
        </div>
      </div>
      <div>
        <GoogleMapView map={map} setMap={setMap} options={{
          center: GOOGLE_MAP_DEFAULT_CENTER,
          zoom: GOOGLE_MAP_DEFAULT_ZOOM,
          maxZoom: GOOGLE_MAP_MAX_ZOOM,
          minZoom: GOOGLE_MAP_MIN_ZOOM,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }
          
        }>
          {routePoints.map((point, index) => (
            <RoutePointMarker key={index} map={map} latLng={point} index={index} onClick={()=>{
              moveStreetView(point);
            }} />
          ))}
        </GoogleMapView>
      </div>
    </div>
  )
}

export default Root