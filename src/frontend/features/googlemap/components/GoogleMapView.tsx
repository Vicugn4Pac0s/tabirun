import { Status, Wrapper } from "@googlemaps/react-wrapper"

import GoogleMapCanvas from "./GoogleMapCanvas"

interface GoogleMapViewProps {
  map: google.maps.Map | null
  setMap: (map: google.maps.Map) => void
  options: google.maps.MapOptions
  onInit?: (map: google.maps.Map) => void
  onClick?: (e: google.maps.MapMouseEvent) => void
  onIdle?: (map: google.maps.Map) => void
  children?: React.ReactNode
}

function GoogleMapView({ map, setMap, options, onInit, onClick, onIdle, children }: GoogleMapViewProps) {
  const render = (status: Status) => {
    return <p>{status}</p>
  }

  return (
    <Wrapper
      apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY as string}
      render={render}
      libraries={["marker"]}
    >
      <GoogleMapCanvas
        className="w-full h-[400px]"
        map={map}
        setMap={setMap}
        onInit={onInit ?? (() => undefined)}
        onClick={onClick}
        onIdle={onIdle}
        options={options}
      >
        {children}
      </GoogleMapCanvas>
    </Wrapper>
  )
}

export default GoogleMapView