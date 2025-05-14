import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { withProductTheme } from "@/.storybook/ProductThemeDecorator";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "outline", "ghost", "link"],
    },
    size: {
      control: { type: "select" },
      options: ["default", "sm", "lg", "icon"],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic button variants
export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost",
  },
};

export const Link: Story = {
  args: {
    variant: "link",
    children: "Link",
  },
};

// Size variants
export const Small: Story = {
  args: {
    size: "sm",
    children: "Small",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large",
  },
};

// Theme-specific examples
export const LilypadButton: Story = {
  args: {
    children: "Lilypad Button",
  },
  decorators: [withProductTheme("lilypad", "light")],
};

export const DarkModeButton: Story = {
  args: {
    children: "Dark Mode Button",
  },
  decorators: [withProductTheme("default", "dark")],
};

export const LilypadDarkButton: Story = {
  args: {
    children: "Lilypad Dark Button",
  },
  decorators: [withProductTheme("lilypad", "dark")],
};
