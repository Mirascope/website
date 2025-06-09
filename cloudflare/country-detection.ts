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
    const url = new URL(request.url);

    // Handle country detection API endpoint
    if (url.pathname === "/cf/country-detection") {
      return handleCountryDetection(request);
    }

    // // Handle CORS preflight for content-meta
    // if (request.method === "OPTIONS" && url.pathname.startsWith("/static/content-meta/")) {
    //   return new Response(null, {
    //     headers: {
    //       "Access-Control-Allow-Origin": "*",
    //       "Access-Control-Allow-Methods": "GET, OPTIONS",
    //       "Access-Control-Allow-Headers": "Content-Type",
    //     },
    //   });
    // }

    // // Handle all content-meta files with CORS headers
    // if (url.pathname.startsWith("/static/content-meta/")) {
    //   // Pass the request to the origin
    //   const response = await fetch(request);

    //   // Clone the response and add CORS headers
    //   const modifiedResponse = new Response(response.body, {
    //     status: response.status,
    //     statusText: response.statusText,
    //     headers: new Headers(response.headers)
    //   });

    //   modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
    //   modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    //   modifiedResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    //   return modifiedResponse;
    // }

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
