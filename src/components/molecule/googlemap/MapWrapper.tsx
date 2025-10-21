import { Status, Wrapper } from "@googlemaps/react-wrapper";
import { GOOGLE_MAP_DEFAULT_CENTER, GOOGLE_MAP_DEFAULT_ZOOM, GOOGLE_MAP_MAX_ZOOM, GOOGLE_MAP_MIN_ZOOM, styledMapTypeOptions } from "~/app/config";
import { useMapStore } from "~/app/stores/googlemap/mapStore";
import Map from "~/components/atoms/googlemap/Map";
import { useEffect, useRef } from "react";

interface MapWrapperProps {
  onInit?: (m: google.maps.Map) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (m: google.maps.Map) => void;
  children: React.ReactNode;
}

function MapWrapper({ onInit, onClick, onIdle, children }: MapWrapperProps) {
  const { map, setMap, setCenter, setZoom } = useMapStore();
  const isInit = useRef(false);
  
  const render = (status: Status) => {
    return <p>{status}</p>;
  };

  useEffect(() => {
    if(isInit.current) return;
    if(!map) return;
    isInit.current = true;
  }, [map]);

  const handleInit = (m: google.maps.Map) => {
    const styledMapType = new window.google.maps.StyledMapType(styledMapTypeOptions);
    m.mapTypes.set("highways_only", styledMapType);
    m.setMapTypeId("highways_only");
    onInit?.(m);
  }

  const handleClick = (e: google.maps.MapMouseEvent) => {
    onClick?.(e);
  };

  const handleIdle = (m: google.maps.Map) => {
    const zoom = m.getZoom();
    if(zoom) setZoom(zoom);
    const center = m.getCenter();
    if (center) setCenter(center.toJSON());
    onIdle?.(m);
  };

  return (
    <Wrapper apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY as string} render={render} libraries={['marker']}>
      <Map className="h-screen w-full" onInit={handleInit} onClick={handleClick} onIdle={handleIdle} map={map} setMap={setMap}
        options={{
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY as string,
          center: GOOGLE_MAP_DEFAULT_CENTER,
          zoom: GOOGLE_MAP_DEFAULT_ZOOM,
          maxZoom: GOOGLE_MAP_MAX_ZOOM,
          minZoom: GOOGLE_MAP_MIN_ZOOM,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}>
        {children}
      </Map>
    </Wrapper>
  )
}

export default MapWrapper