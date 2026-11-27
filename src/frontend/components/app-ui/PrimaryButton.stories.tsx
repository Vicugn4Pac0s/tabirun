import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PrimaryButton } from "./PrimaryButton";

const meta = {
  title: "App UI/PrimaryButton",
  component: PrimaryButton,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { children: "保存する" },
} satisfies Meta<typeof PrimaryButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
