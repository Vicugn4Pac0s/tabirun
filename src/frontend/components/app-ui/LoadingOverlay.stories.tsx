import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import LoadingOverlay from "./LoadingOverlay";

const meta = {
  title: "Atoms/LoadingOverlay",
  component: LoadingOverlay,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="relative flex h-64 w-80 items-center justify-center rounded-lg border bg-gray-100">
        <p className="text-gray-600">背面のコンテンツ</p>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoadingOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
