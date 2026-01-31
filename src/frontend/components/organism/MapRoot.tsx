'use client';

import { useEffect } from "react";
import { useMapStore } from "~/frontend/stores/googlemap/mapStore";
import { useStreetViewPanoramaStore } from "~/frontend/stores/googlemap/streetViewPanoramaStore";
import { useRoutePointsStore } from "~/frontend/stores/googlemap/routePointsStore";
import MapWrapper from "../molecule/googlemap/MapWrapper";
import StreetViewPointMarker from "../molecule/googlemap/StreetViewPointMarker";
import { useDirections } from "~/frontend/hooks/googlemap/useDirections";
import RoutePointMarker from "../molecule/googlemap/RoutePointMarker";
import { useRouteDirectionsStore } from "~/frontend/stores/googlemap/routeDirectionsStore";

const makeRoutePointsKey = (points: google.maps.LatLngLiteral[]) => {
  return points.map(p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join("|");
}

function MapRoot() {
  const streetViewPanorama = useStreetViewPanoramaStore((state) => state.streetViewPanorama);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);
  const streetViewPanoramaPov = useStreetViewPanoramaStore((state) => state.streetViewPanoramaPov);
  const map = useMapStore((state) => state.map);
  const setDirectionsService = useMapStore((state) => state.setDirectionsService);
  const directionsRenderer = useMapStore((state) => state.directionsRenderer);
  const setDirectionsRenderer = useMapStore((state) => state.setDirectionsRenderer);
  const setRouteDirections = useRouteDirectionsStore((state) => state.setRouteDirections);
  const { getDirections } = useDirections();
  const routePoints = useRoutePointsStore((state) => state.routePoints);

  const onInit = (m: google.maps.Map) => {
    const ds = new window.google.maps.DirectionsService();
    const dr = new window.google.maps.DirectionsRenderer({
      suppressMarkers: true,
    });
    dr.setMap(m);
    setDirectionsService(ds);
    setDirectionsRenderer(dr);
  }

  const onClick = (e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if(!latLng || !streetViewPanorama) return; 
    const latLngLiteral = latLng.toJSON() as google.maps.LatLngLiteral;
    streetViewPanorama.setPosition(latLngLiteral);
  };

  useEffect(() => {
    const fetchDirections = async () => {
      const result = await getDirections(routePoints);
      const key = makeRoutePointsKey(routePoints);
      setRouteDirections(key, result);
      if(result && directionsRenderer) {
        directionsRenderer.setMap(map);
        directionsRenderer.setDirections(result);
      } else if(directionsRenderer) {
        directionsRenderer.setMap(null); 
      }
    }
    fetchDirections();
  }, [routePoints]);

  return (
    <MapWrapper onInit={onInit} onClick={onClick}>
      <StreetViewPointMarker map={map} latLng={streetViewPanoramaCenter} pov={streetViewPanoramaPov} />
      {routePoints.map((point, index) => (
        <RoutePointMarker key={index} map={map} latLng={point} index={index} onClick={()=>{
          streetViewPanorama?.setPosition(point);
        }} />
      ))}
    </MapWrapper>
  )
}

export default MapRoot