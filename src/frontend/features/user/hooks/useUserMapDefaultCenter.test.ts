import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_MAP_DEFAULT_CENTER } from "~/frontend/config";
import { useUserMapDefaultCenter } from "~/frontend/features/user/hooks/useUserMapDefaultCenter";

type MockAuthPermission = {
  isAuthenticated: boolean;
  isLoading: boolean;
};

type MockUserQuery = {
  user: {
    homeLat: number | null;
    homeLng: number | null;
  } | null;
  isLoading: boolean;
};

const mockUseAuthPermission = vi.fn<() => MockAuthPermission>();
const mockUseUserQuery = vi.fn<(options: { enabled?: boolean }) => MockUserQuery>();

vi.mock("~/frontend/features/auth/components/hooks/useAuthPermission", () => ({
  useAuthPermission: () => mockUseAuthPermission(),
}));

vi.mock("~/frontend/features/user/hooks/useUserQuery", () => ({
  useUserQuery: (options: { enabled?: boolean }) => mockUseUserQuery(options),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();

  mockUseAuthPermission.mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
  });
  mockUseUserQuery.mockReturnValue({
    user: null,
    isLoading: false,
  });
});

describe("useUserMapDefaultCenter", () => {
  it("未認証時はユーザー取得を無効にしてデフォルト中心を返す", () => {
    const { result } = renderHook(() => useUserMapDefaultCenter());

    expect(mockUseUserQuery).toHaveBeenCalledWith({ enabled: false });
    expect(result.current.defaultCenter).toEqual(GOOGLE_MAP_DEFAULT_CENTER);
    expect(result.current.isReady).toBe(true);
  });

  it("認証 loading 中は ready にならない", () => {
    mockUseAuthPermission.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { result } = renderHook(() => useUserMapDefaultCenter());

    expect(result.current.defaultCenter).toEqual(GOOGLE_MAP_DEFAULT_CENTER);
    expect(result.current.isReady).toBe(false);
  });

  it("認証済みでユーザー取得中は ready にならない", () => {
    mockUseAuthPermission.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseUserQuery.mockReturnValue({
      user: null,
      isLoading: true,
    });

    const { result } = renderHook(() => useUserMapDefaultCenter());

    expect(mockUseUserQuery).toHaveBeenCalledWith({ enabled: true });
    expect(result.current.defaultCenter).toEqual(GOOGLE_MAP_DEFAULT_CENTER);
    expect(result.current.isReady).toBe(false);
  });

  it("ユーザーのホーム地点があれば中心座標として返す", () => {
    mockUseAuthPermission.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseUserQuery.mockReturnValue({
      user: {
        homeLat: 35.681236,
        homeLng: 139.767125,
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useUserMapDefaultCenter());

    expect(result.current.defaultCenter).toEqual({
      lat: 35.681236,
      lng: 139.767125,
    });
    expect(result.current.isReady).toBe(true);
  });

  it("ホーム地点が片方だけならデフォルト中心を返す", () => {
    mockUseAuthPermission.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });
    mockUseUserQuery.mockReturnValue({
      user: {
        homeLat: 35.681236,
        homeLng: null,
      },
      isLoading: false,
    });

    const { result } = renderHook(() => useUserMapDefaultCenter());

    expect(result.current.defaultCenter).toEqual(GOOGLE_MAP_DEFAULT_CENTER);
    expect(result.current.isReady).toBe(true);
  });
});
