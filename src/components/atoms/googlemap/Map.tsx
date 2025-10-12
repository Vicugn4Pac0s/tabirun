import { Children, cloneElement, isValidElement, use, useEffect, useRef } from "react";

interface MapProps {
  children: React.ReactNode;
  onInit: (map: google.maps.Map) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  className?: string;
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map) => void;
  options: google.maps.MapOptions;
}

function Map({children, onInit, onClick, onIdle, className = '', map, setMap, options}: MapProps) {

  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && !map) {
      const m = new window.google.maps.Map(ref.current, options);
      setMap(m);
      onInit(m);
    }
  }, [ref, map])

  useEffect(() => {
    if (map) {
      ["click", "idle"].forEach((eventName) =>
        window.google.maps.event.clearListeners(map, eventName)
      );
      if (onClick) {
        map.addListener("click", onClick);
      }
  
      if (onIdle) {
        map.addListener("idle", () => onIdle(map));
      }

    }
  }, [map, onClick, onIdle]);

  return  (
    <>
      <div className={className} ref={ref} />
      {Children.map(children, (child) => {
        if (isValidElement(child)) {
          return cloneElement(child as React.ReactElement, { map });
        }
      })}
    </>
  );
}

export default Map