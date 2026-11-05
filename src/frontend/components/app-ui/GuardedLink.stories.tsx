import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { GuardedLink } from "./GuardedLink";

const meta = {
  title: "App UI/GuardedLink",
  component: GuardedLink,
  args: { href: "/settings/profile", children: "プロフィールを編集" },
} satisfies Meta<typeof GuardedLink>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const link = within(canvasElement).getByRole("link");
    await expect(link).toHaveAttribute("href", "/settings/profile");
    await userEvent.tab();
    await expect(link).toHaveFocus();
  },
};
