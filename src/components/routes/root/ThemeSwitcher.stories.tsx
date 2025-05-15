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
  argTypes: {},
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LandingLight: Story = {
  decorators: [withProductTheme("mirascope", "light", true)],
};

export const LandingDark: Story = {
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
