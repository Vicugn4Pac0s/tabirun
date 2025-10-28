'use client';

import { useMapStore } from "~/app/stores/googlemap/mapStore";
import MapWrapper from "../molecule/googlemap/MapWrapper";
import StreetViewPointMarker from "../molecule/googlemap/StreetViewPointMarker";
import { useStreetViewPanoramaStore } from "~/app/stores/googlemap/streetViewPanoramaStore";

function MapRoot() {
  const streetViewPanorama = useStreetViewPanoramaStore((state) => state.streetViewPanorama);
  const streetViewPanoramaCenter = useStreetViewPanoramaStore((state) => state.streetViewPanoramaCenter);
  const map = useMapStore((state) => state.map);
  const setDirectionsService = useMapStore((state) => state.setDirectionsService);
  const setDirectionsRenderer = useMapStore((state) => state.setDirectionsRenderer);

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


  return (
    <MapWrapper onInit={onInit} onClick={onClick}>
      {streetViewPanoramaCenter && <StreetViewPointMarker map={map} latLng={streetViewPanoramaCenter} />}
    </MapWrapper>
  )
}

export default MapRoot