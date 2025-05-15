import type { Preview } from "@storybook/react";
import React from "react";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRouter,
} from "@tanstack/react-router";
import { withProductTheme } from "./ProductThemeDecorator";
import "../src/styles.css"; // This imports all other CSS files including themes.css and nav.css

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      disable: true, // Disable default backgrounds since we're using our custom themes
    },
    layout: "fullscreen", // Use full screen layout for all stories by default
    docs: {
      story: {
        inline: false, // Make story embeds use the full width
        height: "300px", // Minimum height for docs mode stories
      },
    },
  },
  globalTypes: {
    product: {
      name: "Product",
      description: "Product theme to use",
      defaultValue: "mirascope",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "mirascope", title: "Mirascope", right: "🟣" },
          { value: "lilypad", title: "Lilypad", right: "🟢" },
        ],
      },
    },
    theme: {
      name: "Theme",
      description: "Color theme to use",
      defaultValue: "light",
      toolbar: {
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
      },
    },
    landingPage: {
      name: "Landing Page",
      description: "Toggle landing page styling",
      defaultValue: false,
      toolbar: {
        icon: "home",
        items: [
          { value: false, title: "Regular Page" },
          { value: true, title: "Landing Page" },
        ],
      },
    },
  },
  decorators: [
    // First wrap in TanStack Router provider to handle router dependencies
    (Story) => {
      // Create a root route with our Story as the component
      const RootRoute = createRootRoute({
        component: () => <Story />,
      });

      // Create router with memory history
      const router = createRouter({
        routeTree: RootRoute,
        history: createMemoryHistory({
          initialEntries: ["/"], // Start at the root path
        }),
      });
      return <RouterProvider router={router} />;
    },

    // Then apply theme decorator
    (Story, context) => {
      // Use story parameters if provided, otherwise use toolbar globals
      const product = context.parameters.product || context.globals.product;
      const theme = context.parameters.theme || context.globals.theme;
      const landingPage =
        context.parameters.landingPage !== undefined
          ? context.parameters.landingPage
          : context.globals.landingPage;

      return withProductTheme(product, theme, landingPage)(Story);
    },
  ],
};

export default preview;
