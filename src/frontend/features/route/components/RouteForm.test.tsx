import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { useRouteDraft } from "../hooks/useRouteDraft";
import { RouteForm } from "./RouteForm";

afterEach(cleanup);

function RouteFormExample() {
  const draft = useRouteDraft({
    title: "朝のルート",
    points: [
      { lat: 35, lng: 135 },
      { lat: 36, lng: 136 },
    ],
  });

  return (
    <RouteForm
      draft={draft}
      onSubmit={draft.form.handleSubmit(async () => undefined)}
      submitText={{ idle: "保存", pending: "保存中..." }}
    >
      <p>地点を登録します。</p>
    </RouteForm>
  );
}

describe("RouteForm のルート名", () => {
  it("未タッチの入力ではエラーを隠し、blur後に表示して修正後に解除する", async () => {
    const user = userEvent.setup();
    render(<RouteFormExample />);
    const input = screen.getByRole("textbox", { name: "ルート名" });

    await user.clear(input);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "保存" })).toBeDisabled(),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");

    await user.tab();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ルート名を入力してください。",
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("ルート名を入力してください。");

    await user.type(input, "新しいルート");
    await waitFor(() =>
      expect(screen.queryByRole("alert")).not.toBeInTheDocument(),
    );
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
  });

  it("blur前でもフォーム送信後にはエラーを表示する", async () => {
    const user = userEvent.setup();
    render(<RouteFormExample />);
    const input = screen.getByRole("textbox", { name: "ルート名" });
    await user.clear(input);
    const form = input.closest("form");
    if (!form) throw new Error("フォームが見つかりません。");

    fireEvent.submit(form);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ルート名を入力してください。",
    );
    expect(input).toHaveAccessibleDescription("ルート名を入力してください。");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("複数フォームのエラーをそれぞれの入力に一意に関連付ける", async () => {
    const user = userEvent.setup();
    render(
      <>
        <RouteFormExample />
        <RouteFormExample />
      </>,
    );
    const inputs = screen.getAllByRole("textbox", { name: "ルート名" });
    for (const input of inputs) {
      await user.clear(input);
      await user.tab();
    }

    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    expect(new Set(inputs.map((input) => input.id)).size).toBe(2);
    const errorIds = inputs.map((input) =>
      input.getAttribute("aria-describedby"),
    );
    expect(new Set(errorIds).size).toBe(2);
    for (const input of inputs) {
      expect(input).toHaveAccessibleDescription("ルート名を入力してください。");
      expect(screen.getAllByRole("alert")).toContain(
        document.getElementById(input.getAttribute("aria-describedby") ?? ""),
      );
    }
  });
});
