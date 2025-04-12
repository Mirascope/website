/**
 * Terminal color utilities for consistent output formatting
 */

export type ConsoleColor =
  | "red"
  | "green"
  | "blue"
  | "yellow"
  | "cyan"
  | "magenta"
  | "gray"
  | "reset";

const colorCodes: Record<ConsoleColor, string> = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
  reset: "\x1b[0m",
};

/**
 * Wraps text with the specified color and resets at the end
 */
export function colorize(text: string, color: ConsoleColor): string {
  return `${colorCodes[color]}${text}${colorCodes.reset}`;
}

/**
 * Logs a message with the specified color
 */
export function coloredLog(message: string, color: ConsoleColor): void {
  console.log(colorize(message, color));
}

/**
 * Print a section header
 */
export function printHeader(title: string, color: ConsoleColor = "blue"): void {
  const headerWidth = 50;
  const paddedTitle = ` ${title} `; // Add one space on each side
  const separatorsLength = headerWidth - paddedTitle.length;

  // Calculate equal padding on both sides (or almost equal if odd length)
  const leftPadLength = Math.floor(separatorsLength / 2);
  const rightPadLength = separatorsLength - leftPadLength;

  const leftSeparator = "=".repeat(leftPadLength);
  const rightSeparator = "=".repeat(rightPadLength);

  console.log("\n" + colorize(`${leftSeparator}${paddedTitle}${rightSeparator}`, color));
}

/**
 * Status icons with colors
 */
export const icons = {
  success: colorize("✓", "green"),
  warning: colorize("⚠", "yellow"),
  error: colorize("✗", "red"),
  info: colorize("ℹ", "blue"),
  arrow: colorize("→", "cyan"),
};
