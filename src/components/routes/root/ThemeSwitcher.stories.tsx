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

export const LandingLight: Story = {
  args: {
    isLandingPage: true,
  },
  decorators: [withProductTheme("mirascope", "light", true)],
};

export const LandingDark: Story = {
  args: {
    isLandingPage: true,
  },
  decorators: [withProductTheme("mirascope", "dark", true)],
};

export const MirascopeLight: Story = {
  decorators: [withProductTheme("mirascope", "light")],
};

export const MirascopeDark: Story = {
  decorators: [withProductTheme("mirascope", "dark")],
};

export const LilypadLight: Story = {
  decorators: [withProductTheme("lilypad", "light")],
};

export const LilypadDark: Story = {
  decorators: [withProductTheme("lilypad", "dark")],
};
