/**
 * Types for the static rendering module
 */
import { Helmet } from "react-helmet";

/**
 * Interface for metadata extracted from page
 */
export interface PageMetadata {
  title: string;
  description: string | null;
  meta: string;
  link: string;
  htmlAttributes: string;
  bodyAttributes: string;
  helmetObject: ReturnType<typeof Helmet.renderStatic>;
}

/**
 * Result of rendering a route to string
 */
export interface RenderResult {
  html: string;
  metadata: PageMetadata;
}
