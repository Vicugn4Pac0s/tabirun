import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import MainActionButton from "./MainActionButton";

import { fn } from 'storybook/test';

const meta = {
  title: 'Atoms/MainActionButton',
  component: MainActionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { onClick: fn() },
} satisfies Meta<typeof MainActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {
  args: {
    type: 'add',
  },
};

export const Delete: Story = {
  args: {
    type: 'delete',
  },
};

export const Play: Story = {
  args: {
    type: 'play',
  },
};