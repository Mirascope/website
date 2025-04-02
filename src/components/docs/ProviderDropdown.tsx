import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useProvider, providers } from "./ProviderContext";
import { cn } from "@/lib/utils";

interface ProviderDropdownProps {
  className?: string;
}

export function ProviderDropdown({ className }: ProviderDropdownProps) {
  const { provider, setProvider } = useProvider();

  return (
    <div className={cn("flex flex-col", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "w-full justify-between",
              provider && "border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400"
            )}
          >
            {provider}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {providers.map((p) => (
            <DropdownMenuItem
              key={p}
              onClick={() => setProvider(p)}
              className={cn(
                "cursor-pointer",
                provider === p && "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-medium"
              )}
            >
              {p}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}