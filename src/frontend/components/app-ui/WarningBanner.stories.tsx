import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { WarningBanner } from "./WarningBanner";

const defaultMessage =
  "情報を取得できませんでした。時間をおいて再度お試しください。";

const meta = {
  title: "Atoms/WarningBanner",
  component: WarningBanner,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-80 max-w-full">
        <Story />
      </div>
    ),
  ],
  args: {
    children: defaultMessage,
  },
} satisfies Meta<typeof WarningBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("alert")).toHaveTextContent(
      defaultMessage,
    );
  },
};

export const LongMessage: Story = {
  args: {
    children:
      "経路を取得できませんでした。現在はスタート・ゴールのみ表示しています。接続状況をご確認のうえ、時間をおいて再度お試しください。地図上の位置を選ぶ操作は引き続き利用できます。",
  },
};

export const WithTitle: Story = {
  args: {
    children: (
      <>
        <p className="font-semibold">利用上限に達しました</p>
        <p className="mt-1">時間をおいて再度お試しください。</p>
      </>
    ),
  },
};
