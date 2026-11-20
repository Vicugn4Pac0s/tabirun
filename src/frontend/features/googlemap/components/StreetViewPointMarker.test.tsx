import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import type AdvancedMarker from "./AdvancedMarker";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StreetViewPointMarker } from "./StreetViewPointMarker";

const { renderMarker } = vi.hoisted(() => ({
  renderMarker: vi.fn((props: ComponentProps<typeof AdvancedMarker>) => (
    <div data-testid="marker">{props.children}</div>
  )),
}));
vi.mock("./AdvancedMarker", () => ({ default: renderMarker }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Google Mapsの呼び出しはAdvancedMarker側のテストに任せ、ここでは参照だけを渡す。
const map = {} as google.maps.Map;
const latLng = { lat: 35, lng: 135 };

describe("StreetViewPointMarker", () => {
  it("必要な値が揃うまで描画せず、揃うとマーカーを作る", () => {
    const pov = { heading: 0, pitch: 0 };
    const { rerender } = render(
      <StreetViewPointMarker map={null} latLng={latLng} pov={pov} />,
    );
    expect(renderMarker).not.toHaveBeenCalled();
    rerender(<StreetViewPointMarker map={map} latLng={null} pov={pov} />);
    expect(renderMarker).not.toHaveBeenCalled();
    rerender(<StreetViewPointMarker map={map} latLng={latLng} pov={null} />);
    expect(renderMarker).not.toHaveBeenCalled();
    rerender(<StreetViewPointMarker map={map} latLng={latLng} pov={pov} />);
    expect(renderMarker.mock.lastCall?.[0].options?.position).toEqual(latLng);
  });

  it("同じDOMを維持し、位置と向きの更新を反映する", () => {
    const { rerender } = render(
      <StreetViewPointMarker
        map={map}
        latLng={latLng}
        pov={{ heading: 0, pitch: 0 }}
      />,
    );
    const content = screen.getByTestId("marker").firstElementChild;
    const arrow = content?.querySelectorAll("div")[1];
    if (!arrow) throw new Error("矢印が生成されていません");
    expect(arrow.style.left).toBe("10px");
    expect(arrow.style.top).toBe("-6px");
    expect(arrow.style.transform).toBe("translate(-50%, -50%) rotate(0deg)");
    const nextPosition = { lat: 36, lng: 136 };
    rerender(
      <StreetViewPointMarker
        map={map}
        latLng={nextPosition}
        pov={{ heading: 90, pitch: 0 }}
      />,
    );
    expect(screen.getByTestId("marker").firstElementChild).toBe(content);
    expect(renderMarker.mock.lastCall?.[0].options?.position).toEqual(
      nextPosition,
    );
    expect(arrow.style.left).toBe("26px");
    expect(parseFloat(arrow.style.top)).toBeCloseTo(10);
    expect(arrow.style.transform).toBe("translate(-50%, -50%) rotate(90deg)");
  });
});
