'use client';

import { useMapStore } from "~/frontend/stores/googlemap/mapStore";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import MapWrapper from "../molecule/googlemap/MapWrapper";
import StreetViewPointMarker from "../molecule/googlemap/StreetViewPointMarker";
import RoutePointMarker from "../molecule/googlemap/RoutePointMarker";
import useStreetViewPanorama from "~/frontend/hooks/googlemap/useStreetViewPanorama";
import useGooglemapDirection from "~/frontend/hooks/api/useGooglemapDirection";
import RoutePolyline from "../molecule/googlemap/RoutePolyline";

function MapRoot() {
  const { streetViewPanorama, streetViewPanoramaCenter, streetViewPanoramaPov, moveStreetViewPanorama } = useStreetViewPanorama();
  const map = useMapStore((state) => state.map);
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { directions } = useGooglemapDirection(routePoints);

  const onInit = (m: google.maps.Map) => {
  }

  const onClick = (e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if(!latLng || !streetViewPanorama) return; 
    const latLngLiteral = latLng.toJSON() as google.maps.LatLngLiteral;
    moveStreetViewPanorama(latLngLiteral);
  };

  return (
    <MapWrapper onInit={onInit} onClick={onClick}>
      <StreetViewPointMarker map={map} latLng={streetViewPanoramaCenter} pov={streetViewPanoramaPov} />
      {directions && <RoutePolyline map={map} polylineArray={directions.path} />}

      {routePoints.map((point, index) => (
        <RoutePointMarker key={index} map={map} latLng={point} index={index} onClick={()=>{
          moveStreetViewPanorama(point);
        }} />
      ))}
    </MapWrapper>
  )
}

export default MapRoot