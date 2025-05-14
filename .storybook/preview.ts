import type { Preview } from "@storybook/react";
import { withProductTheme } from "./ProductThemeDecorator";
import "../src/styles.css";

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
  },
  globalTypes: {
    product: {
      name: "Product",
      description: "Product theme to use",
      defaultValue: "default",
      toolbar: {
        icon: "paintbrush",
        items: [
          { value: "default", title: "Mirascope", right: "🟣" },
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
  },
  decorators: [
    (Story, context) => {
      return withProductTheme(context.globals.product, context.globals.theme)(Story);
    },
  ],
};

export default preview;
