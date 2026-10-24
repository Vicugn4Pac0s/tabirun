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
  setVisible: ReturnType<typeof vi.fn>;
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
    setVisible: vi.fn(),
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
    const onInit = vi.fn(() => {
      expect(streetViewRef.current).toBe(panorama);
    });
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
        onInit={onInit}
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
        onInit={onInit}
        onPositionChanged={latestPositionChanged}
        onPovChanged={latestPovChanged}
      />,
    );

    expect(panoramaConstructor).toHaveBeenCalledTimes(1);
    expect(onInit).toHaveBeenCalledTimes(1);
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
    expect(panorama.setVisible).toHaveBeenCalledWith(false);
  });

  it("地図の初期化を待ち、非表示から再表示した際も生成時の初期位置を使う", () => {
    const streetViewRef: MutableRefObject<google.maps.StreetViewPanorama | null> =
      { current: null };
    const options = { position: { lat: 35, lng: 135 } };
    const onInit = vi.fn();
    const { rerender } = render(
      <StreetView
        map={null}
        streetView={streetViewRef}
        options={options}
        onInit={onInit}
      />,
    );
    expect(panoramaConstructor).not.toHaveBeenCalled();
    rerender(
      <StreetView
        map={map}
        streetView={streetViewRef}
        options={options}
        onInit={onInit}
      />,
    );
    expect(panoramaConstructor).toHaveBeenCalledWith(
      expect.any(HTMLDivElement),
      options,
    );
    expect(onInit).toHaveBeenCalledTimes(1);
    rerender(<></>);
    expect(streetViewRef.current).toBeNull();
    expect(panorama.setVisible).toHaveBeenCalledWith(false);
    rerender(
      <StreetView
        map={map}
        streetView={streetViewRef}
        options={options}
        onInit={onInit}
      />,
    );
    expect(panoramaConstructor).toHaveBeenCalledTimes(2);
    expect(panoramaConstructor).toHaveBeenLastCalledWith(
      expect.any(HTMLDivElement),
      options,
    );
    expect(onInit).toHaveBeenCalledTimes(2);
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
