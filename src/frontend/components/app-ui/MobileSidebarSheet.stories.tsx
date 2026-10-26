import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Button } from "~/frontend/components/ui/button";
import MobileSidebarSheet from "./MobileSidebarSheet";

const meta = {
  title: "Molecules/MobileSidebarSheet",
  component: MobileSidebarSheet,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    trigger: <Button variant="outline">パネルを開く</Button>,
    children: <p>サイドバーのコンテンツ</p>,
  },
} satisfies Meta<typeof MobileSidebarSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "パネルを開く" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog", { name: "メニュー" });
    await expect(
      within(dialog).getByText("サイドバーのコンテンツ"),
    ).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close" }),
    );
    await waitFor(() => expect(dialog).not.toBeVisible());
  },
};

export const CustomTitle: Story = {
  args: { title: "ルート情報" },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "パネルを開く" }),
    );
    const body = within(canvasElement.ownerDocument.body);
    const dialog = await body.findByRole("dialog", { name: "ルート情報" });
    await expect(dialog).toBeVisible();
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Close" }),
    );
  },
};
