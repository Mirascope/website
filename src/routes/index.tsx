import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-136px)] mt-0 md:-mt-16 py-8 md:py-0 overflow-hidden">
      <div className="text-center flex flex-col items-center w-full px-4">
        <div className="mb-6 sm:mb-8 md:mb-10 flex justify-center">
          <div className="relative px-6 py-3">
            <div className="absolute inset-0 bg-white torn-paper-effect"></div>
            <div className="flex flex-row items-center justify-center relative z-10">
              <div className="mr-3 sm:mr-4 w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center">
                <img
                  src="/public/frog-logo.png"
                  alt="Mirascope Frog Logo"
                  className="w-12 sm:w-16 h-auto"
                />
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl text-primary mb-0 font-excalifont handwriting-enabled:font-handwriting">
                Mirascope
              </h1>
            </div>
          </div>
        </div>

        <div className="text-black mt-0 flex flex-col font-medium tracking-tight drop-shadow-sm">
          <span
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: "0.9" }}
            className="whitespace-normal sm:whitespace-nowrap font-excalifont handwriting-enabled:font-handwriting mb-8"
          >
            The AI Engineer's
          </span>
          <span
            style={{ fontSize: "clamp(2.5rem, 8vw, 6rem)", lineHeight: "0.9" }}
            className="whitespace-normal sm:whitespace-nowrap font-excalifont handwriting-enabled:font-handwriting"
          >
            Developer Stack
          </span>
        </div>

        <div className="mt-10 sm:mt-12 md:mt-14 flex flex-col sm:flex-row gap-4 justify-center items-center w-full">
          <a
            href="/docs"
            className="bg-primary text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-primary/90 transition-colors w-full sm:w-auto max-w-[200px] text-center shadow-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the docs
          </a>
          <a
            href="https://join.slack.com/t/mirascope-community/shared_invite/zt-2ilqhvmki-FB6LWluInUCkkjYD3oSjNA"
            className="bg-background border border-gray-300 text-gray-800 px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-50 transition-colors w-fit sm:w-auto text-center shadow-sm"
          >
            Join the community
          </a>
        </div>
      </div>
    </div>
  );
}
