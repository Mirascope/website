import type { Meta, StoryObj } from "@storybook/react";
import ThemeSwitcher from "./ThemeSwitcher";
import { withProductTheme } from "@/.storybook/ProductThemeDecorator";

const meta = {
  title: "Root/ThemeSwitcher",
  component: ThemeSwitcher,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    isLandingPage: {
      control: "boolean",
      description: "Whether the theme switcher is on the landing page",
      defaultValue: false,
    },
  },
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic story showing the ThemeSwitcher on the landing page
export const Landing: Story = {
  args: {
    isLandingPage: true,
  },
};

// Story showing the ThemeSwitcher on a non-landing page
export const NonLanding: Story = {
  args: {
    isLandingPage: false,
  },
};

// Combined with product theme variations
export const LilypadLanding: Story = {
  args: {
    isLandingPage: true,
  },
  decorators: [withProductTheme("lilypad", "light")],
};

export const LilypadNonLanding: Story = {
  args: {
    isLandingPage: false,
  },
  decorators: [withProductTheme("lilypad", "light")],
};

export const DarkModeLanding: Story = {
  args: {
    isLandingPage: true,
  },
  decorators: [withProductTheme("default", "dark")],
};

export const DarkModeNonLanding: Story = {
  args: {
    isLandingPage: false,
  },
  decorators: [withProductTheme("default", "dark")],
};

export const LilypadDarkLanding: Story = {
  args: {
    isLandingPage: true,
  },
  decorators: [withProductTheme("lilypad", "dark")],
};

export const LilypadDarkNonLanding: Story = {
  args: {
    isLandingPage: false,
  },
  decorators: [withProductTheme("lilypad", "dark")],
};
