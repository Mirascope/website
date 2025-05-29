import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";
import { initializeSynchronousHighlighter } from "@/mirascope-ui/lib/code-highlight";

// Initial theme setup (later handled by ThemeSwitcher component)
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");

  // Remove any existing theme classes
  document.documentElement.classList.remove("light", "dark", "sunset-time");

  if (savedTheme === "light") {
    document.documentElement.classList.add("light");
  } else if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    // System preference for initial load
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.add("light");
    }
  }
};

// Apply theme immediately on initial page load
initializeTheme();

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {},
  defaultPreload: "intent",
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
  // Configure scroll to top selectors to manage nested scrollable areas
  scrollToTopSelectors: [
    "#mdx-container", // Main MDX content container
  ],
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("app");
if (!rootElement) {
  console.error("Root element #app not found");
} else {
  // Check if we have prerendered content
  const hasPrerenderedContent = rootElement.innerHTML.trim() !== "";

  // Create a new React root regardless of whether we have prerendered content
  const root = ReactDOM.createRoot(rootElement);

  // Function to mount the app
  const mountApp = async () => {
    // Initialize the synchronous highlighter for TabbedSection use
    // Don't await it - we want it to load in the background
    initializeSynchronousHighlighter();

    if (hasPrerenderedContent) {
      // If we have prerendered content, wait for router to load before replacing it
      // This ensures we have all data ready before switching from SSG content
      await router.load();
    }

    // Always use createRoot/render instead of hydrateRoot to avoid hydration mismatches
    root.render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  };

  // Start mounting the app
  mountApp().catch((error) => {
    console.error("Error mounting app:", error);
  });
}

// Initialize web vitals reporting (it will check for consent internally)
reportWebVitals();
