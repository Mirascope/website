// Cloudflare worker - ES Module syntax

/**
 * Main request handler function
 * @param {Request} request - The incoming request
 * @param {Object} env - Environment bindings
 * @param {Object} ctx - Execution context
 * @return {Response} The response to be sent
 */
async function handleRequest(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname;
  console.log(`handleRequest: ${path}`);

  try {
    // Try to fetch the requested resource
    const response = await fetch(request);

    // Handle successful responses
    if (response.ok) {
      return await handleSuccessfulResponse(response, request);
    }

    // Handle 404s based on request type
    if (response.status === 404) {
      return await handle404(request, path);
    }

    // For other error status codes, return as-is
    console.log(`Non-404 error for ${path}: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`Error handling request ${path}: ${error.message}`);
    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Handles successful responses, adding country code to HTML
 * @param {Response} response - The successful response
 * @param {Request} request - The original request
 * @return {Response} The potentially modified response
 */
async function handleSuccessfulResponse(response, request) {
  const contentType = response.headers.get("content-type") || "";

  // Add country code to HTML responses
  if (contentType.includes("text/html")) {
    const countryCode = request.cf?.country || "";
    console.log(`Adding country code ${countryCode} to HTML response`);
    return addCountryCodeToHtml(response, countryCode);
  }

  // Return other files unchanged
  return response;
}

/**
 * Handles 404 responses based on request type
 * @param {Request} request - The original request
 * @param {string} path - The request path
 * @return {Response} The appropriate 404 response
 */
async function handle404(request, path) {
  console.log(`404 detected for: ${path}`);

  // For JSON requests, return JSON 404
  if (path.endsWith(".json") || request.headers.get("accept")?.includes("application/json")) {
    console.log(`Returning JSON 404 for: ${path}`);
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: "The requested resource was not found",
        path: path,
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  }

  // For page requests, try to serve custom 404.html
  console.log(`Attempting to serve 404.html for: ${path}`);
  return await serve404Page(request);
}

/**
 * Serves the custom 404.html page
 * @param {Request} request - The original request
 * @return {Response} The 404 page response
 */
async function serve404Page(request) {
  try {
    // Create a new request for 404.html
    const url = new URL(request.url);
    url.pathname = "/404.html";
    const notFoundRequest = new Request(url.toString(), {
      method: "GET",
      headers: request.headers,
    });

    const response = await fetch(notFoundRequest);

    if (response.ok) {
      console.log(`Serving custom 404.html`);

      // Add country code to 404.html as well
      const countryCode = request.cf?.country || "";
      const modifiedResponse = addCountryCodeToHtml(response, countryCode);

      // Return with 404 status but custom content
      return new Response(modifiedResponse.body, {
        status: 404,
        headers: modifiedResponse.headers,
      });
    } else {
      console.log(`404.html not found, serving fallback`);
      return serveFallback404();
    }
  } catch (error) {
    console.error(`Error serving 404.html: ${error.message}`);
    return serveFallback404();
  }
}

/**
 * Serves a simple fallback 404 response when 404.html is not available
 * @return {Response} A basic 404 response
 */
function serveFallback404() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
    },
  });
}

/**
 * Adds country code meta tag to HTML head
 * @param {Response} response - The original response
 * @param {string} countryCode - The country code to add
 * @return {Response} The modified response
 */
function addCountryCodeToHtml(response, countryCode) {
  console.log(`Adding country code: ${countryCode} to HTML`);
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        element.append(`<meta name="cf-ipcountry" content="${countryCode}">`, { html: true });
      },
    })
    .transform(response);
}

// ES Module export
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
