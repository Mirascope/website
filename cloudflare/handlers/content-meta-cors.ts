export async function contentMetaCorsHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Handle CORS preflight for content-meta
  if (request.method === "OPTIONS" && url.pathname.startsWith("/static/content-meta/")) {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Handle all content-meta files with CORS headers
  if (url.pathname.startsWith("/static/content-meta/")) {
    // Pass the request to the origin
    const response = await fetch(request);

    // Clone the response and add CORS headers
    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    modifiedResponse.headers.set("Access-Control-Allow-Origin", "*");
    modifiedResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    modifiedResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");
    console.log(`modifying response headers to allow CORS: ${url.pathname}`);

    return modifiedResponse;
  }

  // For non-content-meta requests, return 404
  return new Response("Not Found", { status: 404 });
}
