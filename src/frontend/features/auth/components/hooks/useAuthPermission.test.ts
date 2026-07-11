import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useAuthPermission } from "~/frontend/features/auth/components/hooks/useAuthPermission";

type MockSessionResult = {
  data: { user: { id: string; name: string } } | null;
  status: "loading" | "unauthenticated" | "authenticated";
};

const mockUseSession = vi.fn<() => MockSessionResult>();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useAuthPermission", () => {
  it("loading 中は未認証の guest として扱う", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "loading",
    });

    const { result } = renderHook(() => useAuthPermission());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.plan).toBe("guest");
    expect(result.current.permissions.canUseDirections).toBe(false);
  });

  it("未認証時は guest として扱う", () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
    });

    const { result } = renderHook(() => useAuthPermission());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.plan).toBe("guest");
    expect(result.current.permissions.canUseDirections).toBe(false);
  });

  it("認証済み時は free プランで directions を許可する", () => {
    const session = {
      user: {
        id: "user-1",
        name: "Test User",
      },
    };
    mockUseSession.mockReturnValue({
      data: session,
      status: "authenticated",
    });

    const { result } = renderHook(() => useAuthPermission());

    expect(result.current.session).toEqual(session);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.plan).toBe("free");
    expect(result.current.permissions.canUseDirections).toBe(true);
  });
});
