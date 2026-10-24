import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Polyline from "./Polyline";

const map = {} as google.maps.Map;
const points = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
const setOptions = vi.fn();
const setMap = vi.fn();
const createPolyline = vi.fn(function () {
  return { setOptions, setMap };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("google", { maps: { Polyline: createPolyline } });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Polyline", () => {
  it("地図初期化まで待ち、最新の経路で描画する", () => {
    const { rerender } = render(<Polyline map={null} path={[]} />);
    expect(createPolyline).not.toHaveBeenCalled();
    rerender(<Polyline map={map} path={points} />);
    expect(createPolyline).toHaveBeenCalledTimes(1);
    expect(createPolyline).toHaveBeenCalledWith({ map });
    expect(setOptions).toHaveBeenCalledWith({ map, path: points });
  });

  it("経路更新では線を再生成せず、既存の線を更新する", () => {
    const { rerender, unmount } = render(<Polyline map={map} path={points} />);
    const nextPoints = [points[1]!, points[0]!];
    rerender(<Polyline map={map} path={nextPoints} />);
    expect(createPolyline).toHaveBeenCalledTimes(1);
    expect(setOptions).toHaveBeenLastCalledWith({ map, path: nextPoints });
    expect(setMap).not.toHaveBeenCalled();
    unmount();
    expect(setMap).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("色・太さ・透明度などを変更してもインスタンスを再生成しない", () => {
    const { rerender } = render(
      <Polyline
        map={map}
        path={points}
        options={{ strokeColor: "red", strokeWeight: 5, strokeOpacity: 0.5 }}
      />,
    );
    expect(setOptions).toHaveBeenLastCalledWith({
      map,
      path: points,
      strokeColor: "red",
      strokeWeight: 5,
      strokeOpacity: 0.5,
    });
    rerender(
      <Polyline
        map={map}
        path={points}
        options={{ strokeColor: "blue", strokeWeight: 2, strokeOpacity: 1 }}
      />,
    );
    expect(createPolyline).toHaveBeenCalledTimes(1);
    expect(setOptions).toHaveBeenLastCalledWith({
      map,
      path: points,
      strokeColor: "blue",
      strokeWeight: 2,
      strokeOpacity: 1,
    });
  });

  it("地図がなくなったら線を解除し、再表示時に作り直す", () => {
    const { rerender } = render(<Polyline map={map} path={points} />);
    rerender(<Polyline map={null} path={points} />);
    expect(setMap).toHaveBeenCalledExactlyOnceWith(null);
    rerender(<Polyline map={map} path={points} />);
    expect(createPolyline).toHaveBeenCalledTimes(2);
    expect(setOptions).toHaveBeenLastCalledWith({ map, path: points });
  });
});
