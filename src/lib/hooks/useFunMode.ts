import { useState } from "react";

/**
 * Custom hook to manage "fun mode" state with localStorage persistence
 *
 * @returns [funMode, toggleFunMode] - Current state and toggle function
 */
export function useFunMode(): [boolean, () => void] {
  // Initialize from localStorage if available
  const [funMode, setFunMode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("funMode") === "true";
    }
    return false;
  });

  // Toggle fun mode and update localStorage
  const toggleFunMode = () => {
    const newMode = !funMode;
    setFunMode(newMode);

    if (typeof window !== "undefined") {
      localStorage.setItem("funMode", newMode.toString());
    }
  };

  return [funMode, toggleFunMode];
}

export default useFunMode;
