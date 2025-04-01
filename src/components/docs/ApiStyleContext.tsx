import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Define available API styles
export type ApiStyle = "messages" | "templates";

// Create a context to share the selected API style
interface ApiStyleContextType {
  apiStyle: ApiStyle;
  setApiStyle: (style: ApiStyle) => void;
}

const ApiStyleContext = createContext<ApiStyleContextType | undefined>(undefined);

// API Style Provider component
export function ApiStyleProvider({ 
  children, 
  defaultStyle = "messages" 
}: { 
  children: ReactNode;
  defaultStyle?: ApiStyle;
}) {
  const [apiStyle, setApiStyle] = useState<ApiStyle>(defaultStyle);

  return (
    <ApiStyleContext.Provider value={{ apiStyle, setApiStyle }}>
      {children}
    </ApiStyleContext.Provider>
  );
}

// Hook to access the API style context
export function useApiStyle() {
  const context = useContext(ApiStyleContext);
  if (context === undefined) {
    throw new Error("useApiStyle must be used within an ApiStyleProvider");
  }
  return context;
}

// The API style selector component
export function ApiStyleSelector({ className = "" }: { className?: string }) {
  const { apiStyle, setApiStyle } = useApiStyle();
  const styles: ApiStyle[] = ["messages", "templates"];

  return (
    <div className={`my-4 ${className}`}>
      <h4 className="text-sm font-medium mb-2">API Style:</h4>
      <div className="flex gap-2">
        {styles.map((style) => (
          <button
            key={style}
            onClick={() => setApiStyle(style)}
            className={`px-3 py-1 text-sm rounded-md transition-colors capitalize ${
              apiStyle === style
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            }`}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}