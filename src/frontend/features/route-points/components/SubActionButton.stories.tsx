import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import SubActionButton from "./SubActionButton";

import { expect, fn, userEvent, within } from "storybook/test";

const meta = {
  title: "Features/RoutePoints/SubActionButton",
  component: SubActionButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    onClick: fn(),
    onMouseOver: fn(),
    onMouseOut: fn(),
  },
} satisfies Meta<typeof SubActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const First: Story = {
  play: async ({ canvasElement, args }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "最初へ",
    });
    await expect(button.classList.contains("undefined")).toBe(false);
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
  args: {
    type: "first",
  },
};

export const Prev: Story = {
  args: {
    type: "prev",
  },
};

export const Next: Story = {
  args: {
    type: "next",
  },
};

export const Last: Story = {
  args: {
    type: "last",
  },
};

export const Disabled: Story = {
  args: {
    type: "prev",
    disabled: true,
  },
};
