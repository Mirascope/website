import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// Define available operating systems
export type OSType = "MacOS / Linux" | "Windows";

// Create a context to share the selected OS
interface OSContextType {
  os: OSType;
  setOS: (os: OSType) => void;
}

const OSContext = createContext<OSContextType | undefined>(undefined);

// OS Provider component that wraps the content and provides the state
export function OSContextProvider({ children, defaultOS = "MacOS / Linux" }: { 
  children: ReactNode;
  defaultOS?: OSType;
}) {
  const [os, setOS] = useState<OSType>(defaultOS);

  return (
    <OSContext.Provider value={{ os, setOS }}>
      {children}
    </OSContext.Provider>
  );
}

// Hook to access the OS context
export function useOS() {
  const context = useContext(OSContext);
  if (context === undefined) {
    throw new Error("useOS must be used within an OSContextProvider");
  }
  return context;
}

export const operatingSystems: OSType[] = ["MacOS / Linux", "Windows"];

// The actual selector component
export function OSSelector({ className = "" }: { className?: string }) {
  const { os, setOS } = useOS();

  return (
    <div className={`my-4 ${className}`}>
      <h4 className="text-sm font-medium mb-2">Select Operating System:</h4>
      <div className="flex gap-2">
        {operatingSystems.map((currentOS) => (
          <button
            key={currentOS}
            onClick={() => setOS(currentOS)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              os === currentOS
                ? "bg-primary text-white"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            }`}
          >
            {currentOS}
          </button>
        ))}
      </div>
    </div>
  );
}