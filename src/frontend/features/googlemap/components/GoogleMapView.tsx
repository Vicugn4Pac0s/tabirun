import { env } from "~/env";
import { Status, Wrapper } from "@googlemaps/react-wrapper";

import GoogleMapCanvas from "./GoogleMapCanvas";
import LoadingOverlay from "~/frontend/components/app-ui/LoadingOverlay";

interface GoogleMapViewProps {
  className?: string;
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map) => void;
  options: google.maps.MapOptions;
  onInit?: (map: google.maps.Map) => void;
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  isLoading?: boolean;
  children?: React.ReactNode;
}

/**
 * Maps APIとmarkerライブラリを読み込み、地図と任意の子要素を表示する。
 * API読込中とisLoading時はオーバーレイを表示し、読込失敗時は状態文字列を表示する。
 */
function GoogleMapView({
  className,
  map,
  setMap,
  options,
  onInit,
  onClick,
  onIdle,
  isLoading = false,
  children,
}: GoogleMapViewProps) {
  const apiKey = env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;

  const render = (status: Status) => {
    if (status === Status.LOADING) {
      return (
        <div className="relative h-full">
          <LoadingOverlay />
        </div>
      );
    }

    return <p>{status}</p>;
  };

  return (
    <div className="relative h-full">
      <Wrapper apiKey={apiKey} render={render} libraries={["marker"]}>
        <GoogleMapCanvas
          className={`h-full w-full ${className ?? ""}`}
          map={map}
          setMap={setMap}
          onInit={onInit ?? (() => undefined)}
          onClick={onClick}
          onIdle={onIdle}
          options={{
            mapId: apiKey,
            ...options,
          }}
        >
          {children}
        </GoogleMapCanvas>
      </Wrapper>
      {isLoading && <LoadingOverlay />}
    </div>
  );
}

export default GoogleMapView;
