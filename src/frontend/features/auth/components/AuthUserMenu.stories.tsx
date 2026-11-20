import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SessionProvider } from "next-auth/react";
import { expect, userEvent, within } from "storybook/test";
import { AuthUserMenu } from "./AuthUserMenu";

const meta = {
  title: "Features/Auth/AuthUserMenu",
  component: AuthUserMenu,
  parameters: { nextjs: { appDirectory: true } },
  decorators: [
    (Story) => (
      <SessionProvider session={null}>
        <Story />
      </SessionProvider>
    ),
  ],
} satisfies Meta<typeof AuthUserMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole("button", {
      name: "ログイン",
    });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button).toBeEnabled();
  },
};
