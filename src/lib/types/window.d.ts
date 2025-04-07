// Type declarations for global window object
interface Window {
  // Google Analytics
  gtag?: (
    command: string,
    action: string,
    params?: {
      [key: string]: any;
    }
  ) => void;
}
