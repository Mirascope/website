// Cloudflare worker - Manually deployed at present
// Constants for the application
const SOCIAL_BOTS = [
  "Slackbot",
  "Twitterbot",
  "facebookexternalhit",
  "LinkedInBot",
  "TelegramBot",
  "Discordbot",
  "WhatsApp",
  "Pinterest",
  "Googlebot", // Google's crawler for rich results
];

const ASSET_FILE_REGEX = /\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|pdf|webp)$/i;

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Main request handler function
 * @param {Request} request - The incoming request
 * @return {Response} The response to be sent
 */
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Check if it's an asset file that should be passed through
  if (isAssetFile(path)) {
    console.log(`Asset file detected: ${path}, passing through`);
    return fetch(request);
  }

  // Special handling for /static/ routes
  if (path.startsWith("/static/")) {
    return await handleStaticRequest(request);
  }

  // Check if the request is from a social media bot
  const userAgent = request.headers.get("User-Agent") || "";
  if (isSocialBot(userAgent)) {
    const botResponse = await handleBotRequest(request, url);
    if (botResponse) {
      return botResponse;
    }
  }

  // For non-bot requests or if there's an error with bot handling
  return await handleRegularRequest(request);
}

/**
 * Determines if a path is an asset file
 * @param {string} path - The URL path
 * @return {boolean} True if it's an asset file
 */
function isAssetFile(path) {
  return ASSET_FILE_REGEX.test(path);
}

/**
 * Checks if the request is from a known social media bot
 * @param {string} userAgent - The User-Agent header
 * @return {boolean} True if it's a social media bot
 */
function isSocialBot(userAgent) {
  return SOCIAL_BOTS.some((bot) => userAgent.toLowerCase().includes(bot.toLowerCase()));
}

/**
 * Handles requests from social media bots
 * @param {Request} request - The original request
 * @param {URL} url - The parsed URL
 * @return {Response|null} Response for the bot or null to fallback to regular handling
 */
async function handleBotRequest(request, url) {
  const userAgent = request.headers.get("User-Agent") || "";
  const host = url.hostname;
  const path = url.pathname;

  console.log(`Bot detected: ${userAgent}`);

  try {
    // Generate the OG HTML path
    const ogHtmlPath = getOgHtmlPath(path);

    // Try to fetch the OG HTML file
    const ogResponse = await fetch(`https://${host}${ogHtmlPath}`);

    // If the OG HTML file exists, serve it
    if (ogResponse.ok) {
      console.log(`Serving ${ogHtmlPath} for ${path}`);
      return ogResponse;
    } else {
      console.log(`OG HTML file not found: ${ogHtmlPath}, not rerouting`);
      return null;
    }
  } catch (error) {
    console.error(`Error handling bot request: ${error.message}`);
    return null;
  }
}

/**
 * Handles regular (non-bot) requests by adding country code
 * @param {Request} request - The original request
 * @return {Response} The modified response
 */
async function handleRegularRequest(request) {
  const countryCode = request.cf?.country || "";
  const response = await fetch(request);

  // Only modify HTML responses - check the content type
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    return addCountryCodeToHtml(response, countryCode);
  }

  // Return the unmodified response for non-HTML content
  return response;
}

/**
 * Adds country code meta tag to HTML head
 * @param {Response} response - The original response
 * @param {string} countryCode - The country code to add
 * @return {Response} The modified response
 */
function addCountryCodeToHtml(response, countryCode) {
  // Clone the response so we can modify it
  const newResponse = new Response(response.body, response);

  // Add country code meta tag to HTML head
  return new HTMLRewriter()
    .on("head", {
      element(element) {
        // Insert the country meta tag
        element.append(`<meta name="cf-ipcountry" content="${countryCode}">`, { html: true });
      },
    })
    .transform(newResponse);
}

/**
 * Handles requests to the /static/ directory
 * @param {Request} request - The original request
 * @return {Response} Either the fetched file or a 404 response
 */
async function handleStaticRequest(request) {
  try {
    // Try to fetch the requested static file
    const response = await fetch(request);

    // Check if we actually got the requested file or if we got redirected to index.html
    const contentType = response.headers.get("content-type") || "";
    const url = new URL(request.url);
    const path = url.pathname;

    // For static JSON files, check if we got HTML back (which would indicate a redirect to index.html)
    if (path.endsWith(".json") && contentType.includes("text/html")) {
      console.log(`Static JSON file not found: ${path}, returning 404 instead of HTML`);
      return new Response("JSON file not found", {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    // For other status codes that aren't 200 OK, we can trust those
    if (!response.ok) {
      console.log(`Static file error: ${path}, status: ${response.status}`);
      return response;
    }

    // If we got here, it seems like a legitimate response, return it
    return response;
  } catch (error) {
    console.error(`Error handling static request: ${error.message}`);
    return new Response("Error processing request", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
}

/**
 * Converts a URL path to the corresponding OG HTML path
 * @param {string} path - The URL path
 * @return {string} The path to the OG HTML file
 */
function getOgHtmlPath(path) {
  if (path === "/" || path === "") {
    return "/og-html/index.og.html";
  }

  // Strip leading slash and replace remaining slashes with hyphens
  // Also handle trailing slashes by trimming them off
  const normalizedPath = path.replace(/^\/|\/$/g, "").replace(/\//g, "-");
  return `/og-html/${normalizedPath}.og.html`;
}
