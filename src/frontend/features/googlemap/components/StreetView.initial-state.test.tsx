import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import StreetView from "./StreetView";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

it.each([true, false])(
  "初期イベントがなくても向きを同期し、位置の遅延取得にも対応する (%s)",
  (hasInitialPosition) => {
    const position = { lat: () => 35, lng: () => 139 };
    const pov = { heading: 165, pitch: 0 };
    let currentPosition = hasInitialPosition ? position : null;
    const listeners = new Map<string, () => void>();
    class Panorama {
      getPosition = () => currentPosition;
      getPov = () => pov;
      addListener = (event: string, callback: () => void) => {
        listeners.set(event, callback);
      };
    }
    vi.stubGlobal("google", { maps: { StreetViewPanorama: Panorama } });
    const onPositionChanged = vi.fn();
    const onPovChanged = vi.fn();
    // Google Mapsのインスタンスは外部API境界のため、テストでは最小の代替を渡す。
    const map = {} as google.maps.Map;
    render(
      <StreetView
        map={map}
        streetView={{ current: null }}
        options={{}}
        onPositionChanged={onPositionChanged}
        onPovChanged={onPovChanged}
      />,
    );

    expect(onPovChanged).toHaveBeenCalledWith(pov);
    expect(onPositionChanged).toHaveBeenCalledTimes(hasInitialPosition ? 1 : 0);
    currentPosition = position;
    listeners.get("position_changed")?.();
    expect(onPositionChanged).toHaveBeenLastCalledWith(position);
    listeners.get("pov_changed")?.();
    expect(onPovChanged).toHaveBeenCalledTimes(2);
  },
);
