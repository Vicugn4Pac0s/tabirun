'use client';

import { useMapStore } from "~/frontend/stores/googlemap/mapStore";
import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import MapWrapper from "../molecule/googlemap/MapWrapper";
import StreetViewPointMarker from "../molecule/googlemap/StreetViewPointMarker";
import RoutePointMarker from "../molecule/googlemap/RoutePointMarker";
import useGooglemapDirection from "~/frontend/hooks/api/useGooglemapDirection";
import RoutePolyline from "../molecule/googlemap/RoutePolyline";

const makeRoutePointsKey = (points: google.maps.LatLngLiteral[]) => {
  return points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|");
}

function MapRoot() {
  const streetViewPanorama = useStreetViewPanoramaStore((state) => state.streetViewPanorama);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);
  const streetViewPanoramaPov = useStreetViewPanoramaStore((state) => state.streetViewPanoramaPov);
  const map = useMapStore((state) => state.map);
  const routePoints = useRoutePointsStore((state) => state.routePoints);
  const { directions } = useGooglemapDirection(routePoints);

  const onInit = (m: google.maps.Map) => {
  }

  const onClick = (e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if(!latLng || !streetViewPanorama) return; 
    const latLngLiteral = latLng.toJSON() as google.maps.LatLngLiteral;
    streetViewPanorama.setPosition(latLngLiteral);
  };

  return (
    <MapWrapper onInit={onInit} onClick={onClick}>
      <StreetViewPointMarker map={map} latLng={streetViewPanoramaCenter} pov={streetViewPanoramaPov} />
      {directions && <RoutePolyline map={map} polylineArray={directions.path} />}

      {routePoints.map((point, index) => (
        <RoutePointMarker key={index} map={map} latLng={point} index={index} onClick={()=>{
          streetViewPanorama?.setPosition(point);
        }} />
      ))}
    </MapWrapper>
  )
}

export default MapRoot