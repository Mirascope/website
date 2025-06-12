export async function contentMetaCorsHandler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  console.log(`contentMetaCorsHandler: ${request.method} ${url.pathname}`);

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // Extract the file path from /cf/content-meta/... and map to /static/content-meta/...
  const contentMetaPath = url.pathname.replace("/cf/content-meta/", "/static/content-meta/");
  console.log(`Mapped ${url.pathname} → ${contentMetaPath}`);

  // Defensive checks to prevent directory traversal and ensure valid paths
  if (
    contentMetaPath.includes("..") ||
    contentMetaPath.includes("//") ||
    !contentMetaPath.startsWith("/static/content-meta/") ||
    contentMetaPath === "/static/content-meta/"
  ) {
    console.log(`Security check failed for: ${contentMetaPath}`);
    return new Response("Bad Request", { status: 400 });
  }

  // Create new URL pointing to the static file
  const staticFileUrl = new URL(contentMetaPath, url.origin);
  console.log(`Fetching: ${staticFileUrl.toString()}`);

  try {
    // Fetch the static file
    const response = await fetch(staticFileUrl.toString());
    console.log(`Fetch result: ${response.status} for ${staticFileUrl.toString()}`);

    if (!response.ok) {
      return new Response("Not Found", { status: 404 });
    }

    // Return the content with CORS headers
    const corsResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers),
    });

    corsResponse.headers.set("Access-Control-Allow-Origin", "*");
    corsResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    corsResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    console.log(`Served content-meta with CORS: ${contentMetaPath}`);

    return corsResponse;
  } catch (error) {
    console.error(`Exception fetching ${contentMetaPath}:`, error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
