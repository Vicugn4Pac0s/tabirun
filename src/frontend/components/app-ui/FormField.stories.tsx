import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Input } from "~/frontend/components/ui/input";
import { FormField } from "./FormField";

const meta = {
  title: "App UI/FormField",
  component: FormField,
  args: {
    label: "名前",
    children: (fieldProps) => <Input {...fieldProps} />,
  },
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "名前" });
    await userEvent.click(canvas.getByText("名前"));
    await expect(input).toHaveFocus();
    await userEvent.type(input, "ランナー");
    await expect(input).toHaveValue("ランナー");
  },
};

export const Error: Story = {
  args: { error: "名前を入力してください" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox", { name: "名前" });
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAccessibleDescription("名前を入力してください");
    await expect(canvas.getByRole("alert")).toHaveTextContent(
      "名前を入力してください",
    );
  },
};
