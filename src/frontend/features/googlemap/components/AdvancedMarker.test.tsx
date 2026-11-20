import { cleanup, render } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdvancedMarker from "./AdvancedMarker";

type MarkerMock = {
  map: google.maps.Map | null;
  content: HTMLElement;
  addListener: ReturnType<typeof vi.fn>;
};

const map = {} as google.maps.Map;

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
    const marker = {
      map: markerMap,
      content,
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
  it("地図が初期化されるまでDOMを作らず、更新時も同じDOMとマーカーを使う", () => {
    const createContent = vi.fn(() => document.createElement("div"));
    const updateContent = vi.fn((content: HTMLElement) => {
      content.textContent = "1";
    });
    const { rerender } = render(
      <AdvancedMarker
        map={null}
        createContent={createContent}
        updateContent={updateContent}
      />,
    );
    expect(createContent).not.toHaveBeenCalled();
    expect(markerConstructor).not.toHaveBeenCalled();

    rerender(
      <AdvancedMarker
        map={map}
        createContent={createContent}
        updateContent={updateContent}
        options={{ title: "地点1" }}
      />,
    );
    const content = markers[0]?.content;
    expect(createContent).toHaveBeenCalledOnce();
    expect(content?.textContent).toBe("1");
    expect(markers[0]).toMatchObject({ title: "地点1" });

    const updateLatestContent = vi.fn((element: HTMLElement) => {
      element.textContent = "2";
    });
    rerender(
      <AdvancedMarker
        map={map}
        createContent={createContent}
        updateContent={updateLatestContent}
        options={{ title: "地点2" }}
      />,
    );
    expect(createContent).toHaveBeenCalledOnce();
    expect(markerConstructor).toHaveBeenCalledOnce();
    expect(updateLatestContent).toHaveBeenCalledWith(content);
    expect(content?.textContent).toBe("2");
    expect(markers[0]).toMatchObject({ title: "地点2", content });
  });

  it("生成関数の変更時に旧イベントとマーカーを解除し、新しいDOMへ再登録する", () => {
    const initialContent = document.createElement("div");
    const latestContent = document.createElement("div");
    const createInitialContent = () => initialContent;
    const createLatestContent = () => latestContent;
    const updateContent = vi.fn();
    const initialRemoveEventListener = vi.spyOn(
      initialContent,
      "removeEventListener",
    );
    const latestAddEventListener = vi.spyOn(latestContent, "addEventListener");
    const onClick = vi.fn();
    const onMouseOver: EventListener = vi.fn();
    const onMouseOut: EventListener = vi.fn();
    const events = { onClick, onMouseOver, onMouseOut };

    const { rerender, unmount } = render(
      <AdvancedMarker
        map={map}
        createContent={createInitialContent}
        updateContent={updateContent}
        {...events}
      />,
    );
    rerender(
      <AdvancedMarker
        map={map}
        createContent={createLatestContent}
        updateContent={updateContent}
        {...events}
      />,
    );

    expect(markerConstructor).toHaveBeenCalledTimes(2);
    expect(markers[0]?.map).toBeNull();
    expect(clearInstanceListeners).toHaveBeenCalledWith(markers[0]);
    expect(initialRemoveEventListener).toHaveBeenCalledWith(
      "mouseover",
      onMouseOver,
    );
    expect(initialRemoveEventListener).toHaveBeenCalledWith(
      "mouseout",
      onMouseOut,
    );
    expect(latestAddEventListener).toHaveBeenCalledWith(
      "mouseover",
      onMouseOver,
    );
    expect(latestAddEventListener).toHaveBeenCalledWith("mouseout", onMouseOut);
    expect(markers[1]?.addListener).toHaveBeenCalledWith("click", onClick);
    unmount();
    expect(markers[1]?.map).toBeNull();
    expect(clearInstanceListeners).toHaveBeenCalledTimes(2);
  });

  it("イベントハンドラーだけを更新してもマーカーを作り直さず、古いハンドラーを解除する", () => {
    const content = document.createElement("div");
    const createContent = () => content;
    const updateContent = vi.fn();
    const onMouseOver = vi.fn();
    const onLatestMouseOver = vi.fn();
    const onClick = vi.fn();
    const onLatestClick = vi.fn();
    const { rerender, unmount } = render(
      <AdvancedMarker
        map={map}
        createContent={createContent}
        updateContent={updateContent}
        onMouseOver={onMouseOver}
        onClick={onClick}
      />,
    );
    content.dispatchEvent(new MouseEvent("mouseover"));
    expect(onMouseOver).toHaveBeenCalledOnce();
    rerender(
      <AdvancedMarker
        map={map}
        createContent={createContent}
        updateContent={updateContent}
        onMouseOver={onLatestMouseOver}
        onClick={onLatestClick}
      />,
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

  it("地図が失われたらマーカーを外し、再初期化時は新しい地図へ配置する", () => {
    const createContent = vi.fn(() => document.createElement("div"));
    const updateContent = vi.fn();
    const { rerender } = render(
      <AdvancedMarker
        map={map}
        createContent={createContent}
        updateContent={updateContent}
      />,
    );
    rerender(
      <AdvancedMarker
        map={null}
        createContent={createContent}
        updateContent={updateContent}
      />,
    );
    expect(markers[0]?.map).toBeNull();
    expect(markerConstructor).toHaveBeenCalledOnce();
    rerender(
      <AdvancedMarker
        map={map}
        createContent={createContent}
        updateContent={updateContent}
      />,
    );
    expect(markerConstructor).toHaveBeenCalledTimes(2);
    expect(markers[1]?.map).toBe(map);
  });

  it("StrictModeの再実行後も破棄時にマーカーを残さない", () => {
    const createContent = () => document.createElement("div");
    const { unmount } = render(
      <StrictMode>
        <AdvancedMarker
          map={map}
          createContent={createContent}
          updateContent={vi.fn()}
        />
      </StrictMode>,
    );
    expect(markers.filter((marker) => marker.map !== null)).toHaveLength(1);
    unmount();
    expect(markers.every((marker) => marker.map === null)).toBe(true);
    expect(clearInstanceListeners).toHaveBeenCalledTimes(markers.length);
  });

  it("サーバー描画ではDOM生成関数を呼ばない", () => {
    const createContent = vi.fn(() => document.createElement("div"));
    expect(
      renderToString(
        <AdvancedMarker
          map={map}
          createContent={createContent}
          updateContent={vi.fn()}
        />,
      ),
    ).toBe("");
    expect(createContent).not.toHaveBeenCalled();
    expect(markerConstructor).not.toHaveBeenCalled();
  });
});
