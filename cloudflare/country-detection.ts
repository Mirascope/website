// TypeScript Cloudflare Worker for country detection API

interface CloudflareRequest extends Request {
  cf?: {
    country?: string;
    timezone?: string;
    continent?: string;
    city?: string;
    region?: string;
    [key: string]: any;
  };
}

interface CountryDetectionResponse {
  country: string | null;
  timezone: string | null;
  continent: string | null;
  timestamp: string;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle country detection API endpoint
    if (url.pathname === "/api/country-detection") {
      return handleCountryDetection(request);
    }

    // For all other requests, return 404 (Assets will handle valid files)
    return new Response("Not Found", { status: 404 });
  },
};

/**
 * Handles country detection API requests
 * @param request - The incoming request with CF properties
 * @returns JSON response with country information
 */
function handleCountryDetection(request: Request): Response {
  const cfRequest = request as CloudflareRequest;
  const cf = cfRequest.cf;

  const countryCode = cf?.country || null;
  const timezone = cf?.timezone || null;
  const continent = cf?.continent || null;

  const response: CountryDetectionResponse = {
    country: countryCode,
    timezone: timezone,
    continent: continent,
    timestamp: new Date().toISOString(),
  };

  console.log(`Country detection result: ${JSON.stringify(response)}`);

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET",
      "Cache-Control": "no-cache",
    },
  });
}
