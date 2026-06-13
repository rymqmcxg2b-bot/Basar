const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export const getSources = () => api("/sources");
export const getClaims = () => api("/claims");
export const askLibrary = (question) => api("/ask", {method: "POST", body: JSON.stringify({question})});
export const ingestUrl = (url, title) => api("/ingest/url", {method: "POST", body: JSON.stringify({url, title})});
export const get0gHealth = () => api("/0g/health");
