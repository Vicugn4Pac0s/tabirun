import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { fn } from 'storybook/test';
import { Selectbox } from './Selectbox';

const meta = {
  title: 'Atoms/Selectbox',
  component: Selectbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    items: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
    ],
    onValueChange: fn(),
    placeholder: 'Select an option',
    label: 'Options',
    className: '',
  },
} satisfies Meta<typeof Selectbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
  },
};
