'use client';

import { Status, Wrapper } from "@googlemaps/react-wrapper";
import { GOOGLE_MAP_DEFAULT_CENTER, GOOGLE_MAP_DEFAULT_ZOOM, GOOGLE_MAP_MAX_ZOOM, GOOGLE_MAP_MIN_ZOOM, styledMapTypeOptions } from "~/app/config";
import { useMapStore } from "~/app/stores/googlemap/mapStore";
import Map from "../atoms/googlemap/Map";
import { useEffect, useRef } from "react";

interface MapWrapperProps {
  currentLocation: google.maps.LatLngLiteral | null;
  children: React.ReactNode;
}

/**
 * MapWrapperコンポーネントは、Google Maps APIを使用して地図を表示します。
 * 
 * @param {Object} props - コンポーネントのプロパティ
 * @param {React.ReactNode} props.children - 子コンポーネント
 */
function MapWrapper({ currentLocation, children }: MapWrapperProps) {
  const { map, setMap, setCenter, setZoom } = useMapStore();
  const isInit = useRef(false);
  
  const render = (status: Status) => {
    return <p>{status}</p>;
  };

  useEffect(() => {
    if(isInit.current) return;
    if(!map) return;
    if(!currentLocation) return;
    isInit.current = true;
    map.setCenter(currentLocation);
  }, [map, currentLocation]);

  const onInit = (m: google.maps.Map) => {
    const styledMapType = new window.google.maps.StyledMapType(styledMapTypeOptions);
    m.mapTypes.set("highways_only", styledMapType);
    m.setMapTypeId("highways_only");
    // const ds = new window.google.maps.DirectionsService();
    // const dr = new window.google.maps.DirectionsRenderer({
    //   suppressMarkers: true,
    // });
    // dr.setMap(m);
    // setDirectionsService(ds);
    // setDirectionsRenderer(dr);
  }

  const onClick = (e: google.maps.MapMouseEvent) => {
    const latLng = e.latLng;
    if(!latLng) return; 
    const latLngLiteral = latLng.toJSON() as google.maps.LatLngLiteral;

    // if(page !== 'register') return;
    // addRoutePoint(latLngLiteral);
  };

  const onIdle = (m: google.maps.Map) => {
    const zoom = m.getZoom();
    if(zoom) setZoom(zoom);
    const center = m.getCenter();
    if (center) setCenter(center.toJSON());
  };

  return (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY as string} render={render} libraries={['marker']}>
      <Map className="h-screen w-full" onInit={onInit} onClick={onClick} onIdle={onIdle} map={map} setMap={setMap}
        options={{
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY as string,
          center: GOOGLE_MAP_DEFAULT_CENTER,
          zoom: GOOGLE_MAP_DEFAULT_ZOOM,
          maxZoom: GOOGLE_MAP_MAX_ZOOM,
          minZoom: GOOGLE_MAP_MIN_ZOOM,
          streetViewControl: true,
          mapTypeControl: false,
          fullscreenControl: false
        }}>
        {children}
      </Map>
    </Wrapper>
  )
}

export default MapWrapper