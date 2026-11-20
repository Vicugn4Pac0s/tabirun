import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import { UserMenuView } from "./UserMenuView";

const meta = {
  title: "Features/User/UserMenuView",
  component: UserMenuView,
  parameters: { nextjs: { appDirectory: true } },
  args: { name: "ランナー", onLogout: fn() },
} satisfies Meta<typeof UserMenuView>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithName: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "ユーザーメニュー" }),
    );
    const page = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(page.getByText("ランナー")).toBeVisible());
    await expect(
      page.getByRole("menuitem", { name: "プロフィール" }),
    ).toHaveAttribute("href", "/settings/profile");
    await expect(
      page.getByRole("menuitem", { name: "ログアウト" }),
    ).toBeVisible();
  },
};
export const WithoutName: Story = {
  args: { name: null },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole("button", { name: "ユーザーメニュー" }),
    );
    const page = within(canvasElement.ownerDocument.body);
    await expect(page.queryByText("ランナー")).not.toBeInTheDocument();
    await expect(page.queryByText("My Account")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        page.getByRole("menuitem", { name: "プロフィール" }),
      ).toBeVisible(),
    );
  },
};
