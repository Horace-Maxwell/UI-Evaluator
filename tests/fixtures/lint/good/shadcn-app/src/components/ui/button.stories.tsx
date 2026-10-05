import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = { title: 'UI/Button', component: Button };
export default meta;

export const Gradient: StoryObj<typeof Button> = {
  render: () => (
    <Button className="bg-gradient-to-r from-indigo-500 to-violet-600 transition-all hover:scale-110">
      🚀 Get started
    </Button>
  ),
};
