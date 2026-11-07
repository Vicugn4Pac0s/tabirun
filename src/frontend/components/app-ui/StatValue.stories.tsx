import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { StatValue } from "./StatValue";

const meta = {
  title: "App UI/StatValue",
  component: StatValue,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    value: 100,
    unit: "km",
    className: "",
  },
} satisfies Meta<typeof StatValue>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
