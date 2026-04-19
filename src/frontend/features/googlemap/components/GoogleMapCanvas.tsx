import { Children, cloneElement, isValidElement, useEffect, useRef } from "react"

type GoogleMapChildProps = {
  map: google.maps.Map | null
}

interface GoogleMapCanvasProps {
  children: React.ReactNode
  onInit: (map: google.maps.Map) => void
  onClick?: (e: google.maps.MapMouseEvent) => void
  onIdle?: (map: google.maps.Map) => void
  className?: string
  map: google.maps.Map | null
  setMap: (map: google.maps.Map) => void
  options: google.maps.MapOptions
}

function GoogleMapCanvas({
  children,
  onInit,
  onClick,
  onIdle,
  className = "",
  map,
  setMap,
  options,
}: GoogleMapCanvasProps) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current && !map) {
      const initializedMap = new window.google.maps.Map(ref.current, options)
      setMap(initializedMap)
      onInit(initializedMap)
    }
  }, [map, onInit, options, setMap])

  useEffect(() => {
    if (!map) {
      return
    }

    ;["click", "idle"].forEach((eventName) =>
      window.google.maps.event.clearListeners(map, eventName),
    )

    if (onClick) {
      map.addListener("click", onClick)
    }

    if (onIdle) {
      map.addListener("idle", () => onIdle(map))
    }
  }, [map, onClick, onIdle])

  return (
    <>
      <div className={className} ref={ref} />
      {Children.map(children, (child) => {
        if (isValidElement<GoogleMapChildProps>(child)) {
          return cloneElement(child, { map })
        }

        return child
      })}
    </>
  )
}

export default GoogleMapCanvas