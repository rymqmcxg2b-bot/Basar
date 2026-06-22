// SPDX-License-Identifier: Apache-2.0

import http from "node:http";

const host = "127.0.0.1";
const port = Number(process.env.OG_RELAY_PORT || "8787");
const upstreamBaseUrl = (process.env.OG_ROUTER_BASE_URL || "https://router-api.0g.ai/v1").replace(/\/$/, "");
const apiKey = process.env.OG_ROUTER_API_KEY;
const allowedOrigins = new Set([
  "http://127.0.0.1:4173",
  "http://localhost:4173",
  "http://127.0.0.1:5173",
  "http://localhost:5173",
]);

if (!apiKey) {
  console.error("OG_ROUTER_API_KEY is required. Start the relay from a private terminal, not from recorded UI.");
  process.exit(1);
}

function corsHeaders(origin) {
  if (!allowedOrigins.has(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "content-type, authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

function sendJson(response, statusCode, payload, origin) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...corsHeaders(origin),
  });
  response.end(JSON.stringify(payload));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

function upstreamPath(pathname) {
  if (pathname.startsWith("/v1/")) {
    return pathname.slice(3);
  }
  return pathname;
}

async function proxyToRouter(request, response, parsedUrl, origin) {
  const body = request.method === "GET" ? undefined : await readBody(request);
  const target = `${upstreamBaseUrl}${upstreamPath(parsedUrl.pathname)}${parsedUrl.search}`;
  const upstreamResponse = await fetch(target, {
    method: request.method,
    headers: {
      "Content-Type": request.headers["content-type"] || "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body,
  });
  const text = await upstreamResponse.text();
  console.log(`${request.method} ${parsedUrl.pathname} -> ${upstreamResponse.status}`);
  response.writeHead(upstreamResponse.status, {
    "Content-Type": upstreamResponse.headers.get("content-type") || "application/json",
    ...corsHeaders(origin),
  });
  response.end(text);
}

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  const parsedUrl = new URL(request.url || "/", `http://${host}:${port}`);

  try {
    if (request.method === "OPTIONS") {
      if (!allowedOrigins.has(origin)) {
        console.log(`OPTIONS ${parsedUrl.pathname} -> 403`);
        sendJson(response, 403, {error: "relay_error", message: "Origin is not allowed by this local relay."}, origin);
        return;
      }
      console.log(`OPTIONS ${parsedUrl.pathname} -> 204`);
      response.writeHead(204, corsHeaders(origin));
      response.end();
      return;
    }

    if (parsedUrl.pathname === "/health" && request.method === "GET") {
      console.log("GET /health -> 200");
      sendJson(response, 200, {
        ok: true,
        relay: "basar-0g-router-relay",
        upstream_base_url: upstreamBaseUrl,
        allowed_origins: [...allowedOrigins],
      }, origin);
      return;
    }

    const isModels = parsedUrl.pathname === "/v1/models" && request.method === "GET";
    const isChat = parsedUrl.pathname === "/v1/chat/completions" && request.method === "POST";
    if (!isModels && !isChat) {
      console.log(`${request.method} ${parsedUrl.pathname} -> 404`);
      sendJson(response, 404, {error: "relay_error", message: "Unsupported relay route."}, origin);
      return;
    }

    await proxyToRouter(request, response, parsedUrl, origin);
  } catch (error) {
    console.log(`${request.method} ${parsedUrl.pathname} -> 502`);
    sendJson(response, 502, {
      error: "relay_error",
      message: error?.message || "Unknown relay failure.",
    }, origin);
  }
});

server.listen(port, host, () => {
  console.log(`Basar 0G Router relay listening at http://${host}:${port}`);
  console.log(`Upstream base URL: ${upstreamBaseUrl}`);
  console.log(`Allowed origins: ${[...allowedOrigins].join(", ")}`);
});
