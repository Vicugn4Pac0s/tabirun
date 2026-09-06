import { act, cleanup, render } from "@testing-library/react";
import type { MutableRefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StreetView from "./StreetView";

type ListenerCallback = () => void;

const map = {} as google.maps.Map;
const position = {
  toJSON: () => ({ lat: 34.682952, lng: 135.532147 }),
} as unknown as google.maps.LatLng;
const pov = { heading: 165, pitch: 0 };

let listeners: Map<string, ListenerCallback>;
let listenerRemovers: Map<string, ReturnType<typeof vi.fn>>;
let panorama: {
  addListener: ReturnType<typeof vi.fn>;
  getPosition: ReturnType<typeof vi.fn>;
  getPov: ReturnType<typeof vi.fn>;
};
let panoramaConstructor: ReturnType<typeof vi.fn>;

beforeEach(() => {
  listeners = new Map();
  listenerRemovers = new Map();
  panorama = {
    addListener: vi.fn((eventName: string, callback: ListenerCallback) => {
      const remove = vi.fn();
      listeners.set(eventName, callback);
      listenerRemovers.set(eventName, remove);
      return { remove };
    }),
    getPosition: vi.fn(() => position),
    getPov: vi.fn(() => pov),
  };
  panoramaConstructor = vi.fn(function MockStreetViewPanorama() {
    return panorama;
  });

  Object.defineProperty(window, "google", {
    configurable: true,
    value: {
      maps: {
        StreetViewPanorama: panoramaConstructor,
      },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "google");
});

describe("StreetView", () => {
  it("props更新ではPanoramaを再生成せず、最新callbackを使用する", () => {
    const streetViewRef: MutableRefObject<google.maps.StreetViewPanorama | null> =
      {
        current: null,
      };
    const initialPositionChanged = vi.fn();
    const initialPovChanged = vi.fn();
    const latestPositionChanged = vi.fn();
    const latestPovChanged = vi.fn();
    const initialOptions: google.maps.StreetViewPanoramaOptions = {
      position: { lat: 34.682952, lng: 135.532147 },
    };
    const latestOptions: google.maps.StreetViewPanoramaOptions = {
      position: { lat: 35.681236, lng: 139.767125 },
    };

    const { rerender, unmount } = render(
      <StreetView
        map={map}
        streetView={streetViewRef}
        options={initialOptions}
        onPositionChanged={initialPositionChanged}
        onPovChanged={initialPovChanged}
      />,
    );

    expect(initialPositionChanged).toHaveBeenCalledWith(position);
    expect(initialPovChanged).toHaveBeenCalledWith(pov);
    initialPositionChanged.mockClear();
    initialPovChanged.mockClear();

    rerender(
      <StreetView
        map={map}
        streetView={streetViewRef}
        options={latestOptions}
        onPositionChanged={latestPositionChanged}
        onPovChanged={latestPovChanged}
      />,
    );

    expect(panoramaConstructor).toHaveBeenCalledTimes(1);
    expect(panoramaConstructor).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      initialOptions,
    );

    act(() => {
      listeners.get("position_changed")?.();
      listeners.get("pov_changed")?.();
    });

    expect(initialPositionChanged).not.toHaveBeenCalled();
    expect(initialPovChanged).not.toHaveBeenCalled();
    expect(latestPositionChanged).toHaveBeenCalledWith(position);
    expect(latestPovChanged).toHaveBeenCalledWith(pov);

    unmount();

    expect(listenerRemovers.get("position_changed")).toHaveBeenCalledTimes(1);
    expect(listenerRemovers.get("pov_changed")).toHaveBeenCalledTimes(1);
    expect(streetViewRef.current).toBeNull();
  });

  it("位置を遅延取得した場合も変更イベントで通知する", () => {
    panorama.getPosition.mockReturnValue(null);
    const onPositionChanged = vi.fn();
    const onPovChanged = vi.fn();

    render(
      <StreetView
        map={map}
        streetView={{ current: null }}
        options={{}}
        onPositionChanged={onPositionChanged}
        onPovChanged={onPovChanged}
      />,
    );

    expect(onPositionChanged).not.toHaveBeenCalled();
    expect(onPovChanged).toHaveBeenCalledWith(pov);

    panorama.getPosition.mockReturnValue(position);
    act(() => {
      listeners.get("position_changed")?.();
    });

    expect(onPositionChanged).toHaveBeenCalledWith(position);
  });
});
