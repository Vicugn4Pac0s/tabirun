import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import SubActionButton from "./SubActionButton";

import { fn } from 'storybook/test';

const meta = {
  title: 'Atoms/SubActionButton',
  component: SubActionButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    onMouseOver: fn(),
    onMouseOut: fn(),
  },
} satisfies Meta<typeof SubActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const First: Story = {
  args: {
    type: 'first',
  },
};

export const Prev: Story = {
  args: {
    type: 'prev',
  },
};

export const Next: Story = {
  args: {
    type: 'next',
  },
};

export const Last: Story = {
  args: {
    type: 'last',
  },
};

export const Disabled: Story = {
  args: {
    type: 'prev',
    disabled: true,
  },
};