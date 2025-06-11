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

import type { CountryDetectionResponse } from "@/src/lib/services/country-detection";

export default {
  async fetch(request: Request): Promise<Response> {
    // This worker only handles /cf/country-detection requests
    return handleCountryDetection(request);
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
