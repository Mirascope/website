import type { Meta, StoryObj } from "@storybook/react";
import Header from "./Header";

const meta = {
  title: "Routes/Root/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof Header>;

// Default header in light mode and Mirascope product
export const Default: Story = {
  parameters: {
    product: "mirascope",
    theme: "light",
  },
  args: {
    showProductSelector: false,
  },
};

// Header in dark mode
export const DarkMode: Story = {
  parameters: {
    product: "mirascope",
    theme: "dark",
  },
  args: {
    showProductSelector: false,
  },
};

// Header with product selector for docs pages
export const WithProductSelector: Story = {
  parameters: {
    product: "mirascope",
    theme: "light",
  },
  args: {
    showProductSelector: true,
  },
};

// Lilypad product
export const LilypadProduct: Story = {
  parameters: {
    product: "lilypad",
    theme: "light",
  },
  args: {
    showProductSelector: false,
  },
};

// Landing page header
export const LandingPage: Story = {
  parameters: {
    product: "mirascope",
    theme: "light",
    landingPage: true,
  },
  args: {
    showProductSelector: false,
  },
};

// Lilypad landing page
export const LilypadLandingPage: Story = {
  parameters: {
    product: "lilypad",
    theme: "light",
    landingPage: true,
  },
  args: {
    showProductSelector: false,
  },
};
