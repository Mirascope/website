/**
 * Site-wide constants
 */

// Import GitHub stats from build-time generated file
import githubStats from "./github-stats.json";

// Site version information
export const SITE_VERSION = "1.1";

// Base URL for absolute URLs
// IMPORTANT: When changing this value, also update the hardcoded URLs in index.html
export const BASE_URL = "https://beta.mirascope.com";

// Analytics constants
export const GA_MEASUREMENT_ID = "G-DJHT1QG9GK";

// Product configurations
export const PRODUCT_CONFIGS = {
  mirascope: {
    title: "Mirascope",
    color: "#6366f1",
    description: "LLM abstractions that aren't obstructions.",
    github: {
      repo: "Mirascope/mirascope",
      stars: githubStats.mirascope.stars,
      version: githubStats.mirascope.version,
    },
  },
  lilypad: {
    title: "Lilypad",
    color: "#2d8031",
    description: "Start building your data flywheel in one line of code.",
    github: {
      repo: "Mirascope/lilypad",
      stars: githubStats.lilypad.stars,
      version: githubStats.lilypad.version,
    },
  },
};
