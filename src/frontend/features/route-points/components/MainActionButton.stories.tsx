import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import MainActionButton from "./MainActionButton";

import { expect, fn, userEvent, within } from "storybook/test";

const meta = {
  title: "Features/RoutePoints/MainActionButton",
  component: MainActionButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
    onMouseOver: fn(),
    onMouseOut: fn(),
  },
} satisfies Meta<typeof MainActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "地点を追加",
    });
    await expect(button.classList.contains("undefined")).toBe(false);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
  args: {
    type: "add",
  },
};

export const Delete: Story = {
  args: {
    type: "delete",
  },
};

export const Disabled: Story = {
  args: {
    type: "add",
    disabled: true,
  },
};
