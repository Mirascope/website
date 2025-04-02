import { useProvider, providers } from "./ProviderContext";

// The provider selector component
export function ProviderSelector({ className = "" }: { className?: string }) {
  const { provider, setProvider } = useProvider();

  return (
    <div className={`my-4 ${className}`}>
      <h4 className="text-sm font-medium mb-2">Select Provider:</h4>
      <div className="flex flex-wrap gap-2">
        {providers.map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              provider === p
                ? "bg-primary text-white" 
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}