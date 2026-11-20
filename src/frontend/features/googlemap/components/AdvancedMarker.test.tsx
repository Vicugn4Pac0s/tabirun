import {
  act,
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdvancedMarker from "./AdvancedMarker";

type MarkerMock = {
  map: google.maps.Map | null;
  content: HTMLElement;
  position?: google.maps.LatLngLiteral;
  title: string;
  addListener: ReturnType<typeof vi.fn>;
};

const map = {} as google.maps.Map;
const position = { lat: 35, lng: 135 };

let markers: MarkerMock[];
let markerConstructor: ReturnType<typeof vi.fn>;
let clearInstanceListeners: ReturnType<typeof vi.fn>;
let clearListeners: ReturnType<typeof vi.fn>;

beforeEach(() => {
  markers = [];
  markerConstructor = vi.fn(function MockAdvancedMarkerElement({
    map: markerMap,
    content,
  }: {
    map: google.maps.Map;
    content: HTMLElement;
  }) {
    let markerPosition: google.maps.LatLngLiteral | undefined;
    let markerTitle = "";
    const marker = {
      map: markerMap,
      content,
      get position() {
        return markerPosition;
      },
      set position(value: google.maps.LatLngLiteral | undefined) {
        markerPosition = value;
      },
      get title() {
        return markerTitle;
      },
      set title(value: string) {
        markerTitle = value;
      },
      addListener: vi.fn(),
    };
    markers.push(marker);
    return marker;
  });
  clearInstanceListeners = vi.fn();
  clearListeners = vi.fn();

  Object.defineProperty(window, "google", {
    configurable: true,
    value: {
      maps: {
        event: {
          clearInstanceListeners,
          clearListeners,
        },
        marker: {
          AdvancedMarkerElement: markerConstructor,
        },
      },
    },
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "google");
});

describe("AdvancedMarker", () => {
  it("同じ値のpositionで再描画しても位置とタイトルを書き込まず、変更した値だけ反映する", () => {
    const { rerender } = render(
      <AdvancedMarker map={map} position={{ lat: 35, lng: 135 }} title="地点1">
        <span>1</span>
      </AdvancedMarker>,
    );
    const marker = markers[0];
    if (!marker) throw new Error("マーカーが生成されていません");
    const setPosition = vi.spyOn(marker, "position", "set");
    const setTitle = vi.spyOn(marker, "title", "set");
    rerender(
      <AdvancedMarker map={map} position={{ lat: 35, lng: 135 }} title="地点1">
        <span>2</span>
      </AdvancedMarker>,
    );
    expect(setPosition).not.toHaveBeenCalled();
    expect(setTitle).not.toHaveBeenCalled();
    rerender(
      <AdvancedMarker map={map} position={{ lat: 36, lng: 135 }} title="地点1">
        <span>2</span>
      </AdvancedMarker>,
    );
    expect(setPosition).toHaveBeenCalledExactlyOnceWith({ lat: 36, lng: 135 });
    expect(setTitle).not.toHaveBeenCalled();
    rerender(
      <AdvancedMarker map={map} position={{ lat: 36, lng: 135 }} title="地点2">
        <span>2</span>
      </AdvancedMarker>,
    );
    expect(setPosition).toHaveBeenCalledOnce();
    expect(setTitle).toHaveBeenCalledExactlyOnceWith("地点2");
    rerender(
      <AdvancedMarker map={map} position={{ lat: 36, lng: 135 }}>
        <span>2</span>
      </AdvancedMarker>,
    );
    expect(setTitle).toHaveBeenLastCalledWith("");
    expect(markerConstructor).toHaveBeenCalledOnce();
  });
  it("地図の初期化を待ち、childrenとタイトルの更新では同じDOMとマーカーを使う", () => {
    const { rerender } = render(
      <AdvancedMarker position={position} map={null}>
        <span>1</span>
      </AdvancedMarker>,
    );
    expect(markerConstructor).not.toHaveBeenCalled();
    rerender(
      <AdvancedMarker position={position} map={map} title="地点1">
        <span>1</span>
      </AdvancedMarker>,
    );
    const content = markers[0]?.content;
    if (!content) throw new Error("マーカーが生成されていません");
    const label = within(content).getByText("1");
    expect(markers[0]).toMatchObject({ title: "地点1" });

    rerender(
      <AdvancedMarker position={position} map={map} title="地点2">
        <span>2</span>
      </AdvancedMarker>,
    );
    expect(markerConstructor).toHaveBeenCalledOnce();
    expect(within(content).getByText("2")).toBe(label);
    expect(markers[0]).toMatchObject({ title: "地点2", content });
  });

  it("地図変更時に旧イベントとマーカーを解除し、新しい地図へ再登録する", () => {
    const nextMap = {} as google.maps.Map;
    const onClick = vi.fn();
    const onMouseOver: EventListener = vi.fn();
    const onMouseOut: EventListener = vi.fn();
    const events = { onClick, onMouseOver, onMouseOut };
    const { rerender, unmount } = render(
      <AdvancedMarker position={position} map={map} {...events}>
        <span>地点</span>
      </AdvancedMarker>,
    );
    const content = markers[0]?.content;
    if (!content) throw new Error("マーカーが生成されていません");
    const removeEventListener = vi.spyOn(content, "removeEventListener");
    const addEventListener = vi.spyOn(content, "addEventListener");
    rerender(
      <AdvancedMarker position={position} map={nextMap} {...events}>
        <span>地点</span>
      </AdvancedMarker>,
    );

    expect(markerConstructor).toHaveBeenCalledTimes(2);
    expect(markers[0]?.map).toBeNull();
    expect(clearInstanceListeners).toHaveBeenCalledWith(markers[0]);
    expect(removeEventListener).toHaveBeenCalledWith("mouseover", onMouseOver);
    expect(removeEventListener).toHaveBeenCalledWith("mouseout", onMouseOut);
    expect(addEventListener).toHaveBeenCalledWith("mouseover", onMouseOver);
    expect(addEventListener).toHaveBeenCalledWith("mouseout", onMouseOut);
    expect(markers[1]).toMatchObject({ map: nextMap, content });
    expect(markers[1]?.addListener).toHaveBeenCalledWith("click", onClick);
    unmount();
    expect(markers[1]?.map).toBeNull();
    expect(clearInstanceListeners).toHaveBeenCalledTimes(2);
    expect(content).toBeEmptyDOMElement();
  });

  it("イベントハンドラーだけを更新してもマーカーを作り直さず、古いハンドラーを解除する", () => {
    const onMouseOver = vi.fn();
    const onLatestMouseOver = vi.fn();
    const onClick = vi.fn();
    const onLatestClick = vi.fn();
    const { rerender, unmount } = render(
      <AdvancedMarker
        position={position}
        map={map}
        onMouseOver={onMouseOver}
        onClick={onClick}
      >
        <span>地点</span>
      </AdvancedMarker>,
    );
    const content = markers[0]?.content;
    if (!content) throw new Error("マーカーが生成されていません");
    content.dispatchEvent(new MouseEvent("mouseover"));
    expect(onMouseOver).toHaveBeenCalledOnce();
    rerender(
      <AdvancedMarker
        position={position}
        map={map}
        onMouseOver={onLatestMouseOver}
        onClick={onLatestClick}
      >
        <span>地点</span>
      </AdvancedMarker>,
    );
    content.dispatchEvent(new MouseEvent("mouseover"));
    expect(onMouseOver).toHaveBeenCalledOnce();
    expect(onLatestMouseOver).toHaveBeenCalledOnce();
    expect(markerConstructor).toHaveBeenCalledOnce();
    expect(clearListeners).toHaveBeenCalledWith(markers[0], "click");
    expect(markers[0]?.addListener).toHaveBeenLastCalledWith(
      "click",
      onLatestClick,
    );
    unmount();
    content.dispatchEvent(new MouseEvent("mouseover"));
    expect(onLatestMouseOver).toHaveBeenCalledOnce();
  });

  it("地図が失われたらマーカーを外し、再初期化時は再配置する", () => {
    const { rerender } = render(
      <AdvancedMarker position={position} map={map}>
        <span>地点</span>
      </AdvancedMarker>,
    );
    const content = markers[0]?.content;
    rerender(
      <AdvancedMarker position={position} map={null}>
        <span>地点</span>
      </AdvancedMarker>,
    );
    expect(markers[0]?.map).toBeNull();
    expect(markerConstructor).toHaveBeenCalledOnce();
    rerender(
      <AdvancedMarker position={position} map={map}>
        <span>地点</span>
      </AdvancedMarker>,
    );
    expect(markerConstructor).toHaveBeenCalledTimes(2);
    expect(markers[1]).toMatchObject({ map, content });
  });

  it("StrictModeの再実行後も破棄時にマーカーと子要素を残さない", () => {
    const { unmount } = render(
      <StrictMode>
        <AdvancedMarker position={position} map={map}>
          <span>地点</span>
        </AdvancedMarker>
      </StrictMode>,
    );
    expect(markers.filter((marker) => marker.map !== null)).toHaveLength(1);
    unmount();
    expect(markers.every((marker) => marker.map === null)).toBe(true);
    expect(
      markers.every((marker) => marker.content.childElementCount === 0),
    ).toBe(true);
    expect(clearInstanceListeners).toHaveBeenCalledTimes(markers.length);
  });

  it("documentのないサーバーではDOMとマーカーを作らない", () => {
    const createElement = vi.spyOn(document, "createElement");
    vi.stubGlobal("document", undefined);
    try {
      expect(
        renderToString(
          <AdvancedMarker position={position} map={map}>
            <span>地点</span>
          </AdvancedMarker>,
        ),
      ).toBe("");
      expect(createElement).not.toHaveBeenCalled();
      expect(markerConstructor).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("Portal内のReactイベントは子要素とReactツリー上の親へ伝わる", () => {
    const onParentClick = vi.fn();
    const onChildClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <AdvancedMarker position={position} map={map}>
          <button onClick={onChildClick}>地点</button>
        </AdvancedMarker>
      </div>,
    );
    const content = markers[0]?.content;
    if (!content) throw new Error("マーカーが生成されていません");
    fireEvent.click(within(content).getByRole("button", { name: "地点" }));
    expect(onChildClick).toHaveBeenCalledOnce();
    expect(onParentClick).toHaveBeenCalledOnce();
  });

  it("未初期化の地図をhydrateした後、初期化時に子要素を表示できる", () => {
    const host = document.createElement("div");
    host.innerHTML = renderToString(
      <AdvancedMarker position={position} map={null}>
        <span>地点</span>
      </AdvancedMarker>,
    );
    const onRecoverableError = vi.fn();
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(
        host,
        <AdvancedMarker position={position} map={null}>
          <span>地点</span>
        </AdvancedMarker>,
        { onRecoverableError },
      );
    });
    const hydratedRoot = root;
    if (!hydratedRoot) throw new Error("hydrateされていません");
    act(() => {
      hydratedRoot.render(
        <AdvancedMarker position={position} map={map}>
          <span>地点</span>
        </AdvancedMarker>,
      );
    });
    const content = markers[0]?.content;
    if (!content) throw new Error("マーカーが生成されていません");
    expect(content).toHaveTextContent("地点");
    expect(onRecoverableError).not.toHaveBeenCalled();
    act(() => {
      hydratedRoot.unmount();
    });
  });
});
