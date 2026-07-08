import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DirectionsWarningBanner from "~/frontend/features/run-detail/components/DirectionsWarningBanner";

describe("DirectionsWarningBanner", () => {
  it("quota 超過時の文言を表示する", () => {
    render(
      <DirectionsWarningBanner
        error={{ data: { code: "TOO_MANY_REQUESTS" } } as never}
      />,
    );

    expect(
      screen.getByText("自動ルート生成の利用上限に達しました"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "本日は直線ルートを表示しています。時間をおいて再度お試しください。",
      ),
    ).toBeInTheDocument();
  });

  it("route 未検出時の文言を表示する", () => {
    render(
      <DirectionsWarningBanner error={{ data: { code: "NOT_FOUND" } } as never} />,
    );

    expect(
      screen.getByText("自動ルートを生成できませんでした"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "経由点を見直してください。現在は直線ルートを表示しています。",
      ),
    ).toBeInTheDocument();
  });

  it("その他のエラー時は汎用メッセージを表示する", () => {
    render(
      <DirectionsWarningBanner
        error={{ data: { code: "INTERNAL_SERVER_ERROR" } } as never}
      />,
    );

    expect(
      screen.getByText("自動ルート生成に失敗しました"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "現在は直線ルートを表示しています。時間をおいて再度お試しください。",
      ),
    ).toBeInTheDocument();
  });
});
