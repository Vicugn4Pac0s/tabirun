import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormField } from "./FormField";

afterEach(cleanup);

describe("FormField", () => {
  it("同じラベルでも入力ごとに一意なIDを接続する", () => {
    render(
      <>
        <FormField label="名前">{(props) => <input {...props} />}</FormField>
        <FormField label="名前">{(props) => <input {...props} />}</FormField>
      </>,
    );
    const inputs = screen.getAllByRole("textbox", { name: "名前" });
    expect(inputs).toHaveLength(2);
    expect(new Set(inputs.map((input) => input.id)).size).toBe(2);
    for (const input of inputs) {
      expect(input.id).not.toBe("");
      expect(input).toHaveAttribute("aria-invalid", "false");
      expect(input).not.toHaveAttribute("aria-describedby");
    }
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("エラーを入力に関連付け、解消したら属性とメッセージを取り除く", () => {
    const { rerender } = render(
      <FormField label="名前" error="入力してください">
        {(props) => <input {...props} />}
      </FormField>,
    );
    const input = screen.getByRole("textbox", { name: "名前" });
    const id = input.id;
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("入力してください");
    expect(screen.getByRole("alert")).toHaveAttribute(
      "id",
      input.getAttribute("aria-describedby"),
    );
    expect(screen.getByRole("alert")).toHaveClass("text-destructive");
    rerender(
      <FormField label="名前">{(props) => <input {...props} />}</FormField>,
    );
    expect(input.id).toBe(id);
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
