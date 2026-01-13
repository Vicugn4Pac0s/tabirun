'use client';

import { useEffect } from "react";
import { useMapStore } from "~/app/stores/googlemap/mapStore";
import { useStreetViewPanoramaStore } from "~/app/stores/googlemap/streetViewPanoramaStore";
import { useRouteStore } from "~/app/stores/googlemap/routeStore";
import MapWrapper from "../molecule/googlemap/MapWrapper";
import StreetViewPointMarker from "../molecule/googlemap/StreetViewPointMarker";
import { useDirections } from "~/app/hooks/googlemap/useDirections";

function MapRoot() {
  const streetViewPanorama = useStreetViewPanoramaStore((state) => state.streetViewPanorama);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);
  const streetViewPanoramaPov = useStreetViewPanoramaStore((state) => state.streetViewPanoramaPov);
  const map = useMapStore((state) => state.map);
  const setDirectionsService = useMapStore((state) => state.setDirectionsService);
  const directionsRenderer = useMapStore((state) => state.directionsRenderer);
  const setDirectionsRenderer = useMapStore((state) => state.setDirectionsRenderer);
  const { getDirections } = useDirections();
  const routePoints = useRouteStore((state) => state.routePoints);

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
    // if(page !== 'register') return;
    // addRoutePoint(latLngLiteral);
  };

  useEffect(() => {
    const fetchDirections = async () => {
      const result = await getDirections(routePoints);
      if(result && directionsRenderer) {
        directionsRenderer.setDirections(result);
      }
    }
    fetchDirections();
  }, [routePoints]);

  return (
    <MapWrapper onInit={onInit} onClick={onClick}>
      <StreetViewPointMarker map={map} latLng={streetViewPanoramaCenter} pov={streetViewPanoramaPov} />
    </MapWrapper>
  )
}

export default MapRoot