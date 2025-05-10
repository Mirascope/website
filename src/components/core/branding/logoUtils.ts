/**
 * Shared utilities for logo components
 */

export type LogoSize = "micro" | "small" | "medium" | "large";

export interface LogoSizeConfig {
  container: string;
  img: string;
  text: string;
  spacing: string;
  wrapper: string;
}

/**
 * Size configurations for logos - shared across all product logos
 * for consistent sizing and spacing
 */
export const logoSizeMap: Record<LogoSize, LogoSizeConfig> = {
  micro: {
    container: "w-auto",
    img: "h-4 w-auto",
    text: "text-s",
    spacing: "mr-1.5",
    wrapper: "px-1.5 py-0.5",
  },
  small: {
    container: "w-auto",
    img: "h-7 w-auto",
    text: "text-2xl",
    spacing: "mr-2",
    wrapper: "px-4 py-2",
  },
  medium: {
    container: "w-auto",
    img: "h-10 w-auto",
    text: "text-3xl",
    spacing: "mr-3",
    wrapper: "px-5 py-2.5",
  },
  large: {
    container: "w-auto",
    img: "w-16 h-auto",
    text: "text-5xl",
    spacing: "mr-4",
    wrapper: "px-6 py-3",
  },
};

/**
 * Base props shared across all logo components
 */
export interface BaseLogoProps {
  size?: LogoSize;
  withText?: boolean;
  className?: string;
  textClassName?: string;
  imgClassName?: string;
  containerClassName?: string;
}
