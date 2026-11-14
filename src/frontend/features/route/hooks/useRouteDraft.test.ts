import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useRouteDraft } from "./useRouteDraft";

afterEach(cleanup);

describe("useRouteDraft 地点上限", () => {
  it("27地点まで追加し、連続操作でも28地点目を拒否し、削除後は再追加できる", async () => {
    const points = Array.from({ length: 26 }, (_, i) => ({
      lat: 35 + i / 100,
      lng: 135,
    }));
    const last = { lat: 36, lng: 136 };
    const extra = { lat: 37, lng: 137 };
    const { result } = renderHook(() =>
      useRouteDraft({ title: "朝のラン", points }),
    );
    await act(async () => {
      result.current.togglePoint(last);
      result.current.togglePoint(extra);
    });
    expect(result.current.points).toEqual([...points, last]);
    await act(async () => result.current.togglePoint(last));
    expect(result.current.points).toEqual(points);
    await act(async () => result.current.togglePoint(extra));
    expect(result.current.points).toEqual([...points, extra]);
  });

  it("上限に達した保存済みルートでも追加を拒否する", async () => {
    const points = Array.from({ length: 27 }, (_, i) => ({
      lat: 35 + i / 100,
      lng: 135,
    }));
    const { result } = renderHook(() =>
      useRouteDraft({ title: "朝のラン", points }),
    );
    await act(async () => result.current.togglePoint({ lat: 37, lng: 137 }));
    expect(result.current.points).toEqual(points);
    expect(result.current.isDirty).toBe(false);
  });
});
