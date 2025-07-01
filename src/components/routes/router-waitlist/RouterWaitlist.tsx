import { RouterWaitlistForm } from "./RouterWaitlistForm";
import { MirascopeV2Block } from "./MirascopeV2Block";
import { ProviderContextProvider } from "@/src/components/core/providers/ProviderContext";

export function RouterWaitlist() {
  return (
    <div className="mt-32">
      <ProviderContextProvider>
        <div data-gradient-fade={true} className="mb-4">
          <MirascopeV2Block />
        </div>
      </ProviderContextProvider>
      <RouterWaitlistForm />
    </div>
  );
}
