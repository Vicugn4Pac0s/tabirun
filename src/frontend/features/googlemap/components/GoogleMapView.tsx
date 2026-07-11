import { Wrapper, type Status } from "@googlemaps/react-wrapper"

import GoogleMapCanvas from "./GoogleMapCanvas"

interface GoogleMapViewProps {
  className?: string
  map: google.maps.Map | null
  setMap: (map: google.maps.Map) => void
  options: google.maps.MapOptions
  onInit?: (map: google.maps.Map) => void
  onClick?: (e: google.maps.MapMouseEvent) => void
  onIdle?: (map: google.maps.Map) => void
  children?: React.ReactNode
}

function GoogleMapView({ className, map, setMap, options, onInit, onClick, onIdle, children }: GoogleMapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY!

  const render = (status: Status) => {
    return <p>{status}</p>
  }

  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={["marker"]}
    >
      <GoogleMapCanvas
        className={`w-full h-full ${className ?? ""}`}
        map={map}
        setMap={setMap}
        onInit={onInit ?? (() => undefined)}
        onClick={onClick}
        onIdle={onIdle}
        options={{
          mapId: apiKey,
          ...options
        }}
      >
        {children}
      </GoogleMapCanvas>
    </Wrapper>
  )
}

export default GoogleMapView
