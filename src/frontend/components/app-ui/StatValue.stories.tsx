import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';
import { StatValue } from './StatValue';

const meta = {
  title: 'Atoms/StatValue',
  component: StatValue,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    value: 100,
    unit: 'km',
    className: '',
  },
} satisfies Meta<typeof StatValue>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
  },
};
