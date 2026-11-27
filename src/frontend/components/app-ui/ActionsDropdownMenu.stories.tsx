import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/frontend/components/ui/dropdown-menu";
import { ActionsDropdownMenu } from "./ActionsDropdownMenu";

const meta = {
  title: "App UI/ActionsDropdownMenu",
  component: ActionsDropdownMenu,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: {
    "aria-label": "操作を開く",
    children: (
      <>
        <DropdownMenuItem>編集する</DropdownMenuItem>
        <DropdownMenuItem>複製する</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>削除する</DropdownMenuItem>
      </>
    ),
  },
} satisfies Meta<typeof ActionsDropdownMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
