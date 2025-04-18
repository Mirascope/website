import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

import "./styles.css";
import reportWebVitals from "./reportWebVitals.ts";

// Initial theme setup (later handled by ThemeSwitcher component)
const initializeTheme = () => {
  const savedTheme = localStorage.getItem("theme");

  // Remove any existing theme classes
  document.documentElement.classList.remove("light", "dark", "sunset");

  if (savedTheme === "light") {
    document.documentElement.classList.add("light");
  } else if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (savedTheme === "sunset") {
    document.documentElement.classList.add("sunset");
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
} else if (rootElement.innerHTML.trim() === "") {
  // Empty DOM - create a new React root (development mode)
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
} else {
  // Non-empty DOM - hydrate the existing content (SSG/prerendered HTML)
  ReactDOM.hydrateRoot(
    rootElement,
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}

// Initialize web vitals reporting (it will check for consent internally)
reportWebVitals();
