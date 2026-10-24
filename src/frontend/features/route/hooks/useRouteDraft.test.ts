import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useRouteDraft } from "./useRouteDraft";

const initialRoute = {
  title: "朝のルート",
  points: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
};
afterEach(cleanup);

describe("useRouteDraft", () => {
  it("保存済みルートを初期値にして、タイトル未設定は空欄にする", () => {
    const { result } = renderHook(() =>
      useRouteDraft({ ...initialRoute, title: null }),
    );
    expect(result.current.title).toBe("");
    expect(result.current.points).toEqual(initialRoute.points);
  });

  it("タイトル変更や親の再描画で経由地点を変えず、入力を上書きしない", () => {
    const { result, rerender } = renderHook(
      ({ route }) => useRouteDraft(route),
      { initialProps: { route: initialRoute } },
    );
    act(() => result.current.setTitle("夕方のルート"));
    rerender({ route: { ...initialRoute, title: "再取得したルート名" } });
    expect(result.current.title).toBe("夕方のルート");
    expect(result.current.points).toEqual(initialRoute.points);
    expect(initialRoute.title).toBe("朝のルート");
  });

  it("別の編集画面に下書きが混入しない", () => {
    const first = renderHook(() => useRouteDraft(initialRoute));
    act(() => first.result.current.setTitle("編集中"));
    const second = renderHook(() => useRouteDraft(initialRoute));
    expect(second.result.current.title).toBe("朝のルート");
  });
});
