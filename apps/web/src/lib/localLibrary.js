const SOURCES_KEY = "basar:sources";
const CLAIMS_KEY = "basar:claims";
const SETTINGS_KEY = "basar:settings";
const AI_PROFILES_KEY = "basar:ai-profiles";

const DEFAULT_SETTINGS = {
  routerEndpoint: "http://127.0.0.1:8787/v1",
  model: "",
  apiKey: "",
  persistApiKey: false,
  storageEndpoint: "",
  storageApiKey: "",
  persistStorageKey: false,
};

const DEMO_SOURCE_TEXT = [
  "Basar is a local-first evidence memory layer for research teams and AI agents.",
  "A source card records where a source came from, when it was acquired, what claims may depend on it, and whether the evidence needs more verification.",
  "A growth package is a portable JSON archive of user-added sources and extracted claims that can be exported locally or sent to a user-controlled 0G storage endpoint.",
  "Basar does not require a shared backend for local evidence work. For live 0G Router inference, users should use a CORS-compatible endpoint or a user-controlled local relay so Router API keys stay outside the browser.",
  "Model answers should cite retrieved sources and state uncertainty when evidence is thin.",
].join(" ");

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadSources() {
  return readJson(SOURCES_KEY, []);
}

export function saveSources(sources) {
  writeJson(SOURCES_KEY, sources);
}

export function loadClaims() {
  return readJson(CLAIMS_KEY, []);
}

export function saveClaims(claims) {
  writeJson(CLAIMS_KEY, claims);
}

export function loadSettings() {
  const saved = readJson(SETTINGS_KEY, DEFAULT_SETTINGS);
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    apiKey: saved.persistApiKey ? saved.apiKey || "" : "",
    storageApiKey: saved.persistStorageKey ? saved.storageApiKey || "" : "",
  };
}

export function saveSettings(settings) {
  writeJson(SETTINGS_KEY, {
    routerEndpoint: settings.routerEndpoint || DEFAULT_SETTINGS.routerEndpoint,
    model: settings.model || "",
    apiKey: settings.persistApiKey ? settings.apiKey || "" : "",
    persistApiKey: Boolean(settings.persistApiKey),
    storageEndpoint: settings.storageEndpoint || "",
    storageApiKey: settings.persistStorageKey ? settings.storageApiKey || "" : "",
    persistStorageKey: Boolean(settings.persistStorageKey),
  });
}

export function loadAiProfiles() {
  return readJson(AI_PROFILES_KEY, []);
}

export function saveAiProfiles(profiles) {
  writeJson(AI_PROFILES_KEY, profiles);
}

export function createAiProfile({name, routerEndpoint, model, apiKey, enabled = true}) {
  return {
    id: `profile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || model.trim() || "0G Router relay profile",
    routerEndpoint: routerEndpoint.trim(),
    model: model.trim(),
    apiKey,
    enabled: Boolean(enabled),
  };
}

export function clearLibrary() {
  localStorage.removeItem(SOURCES_KEY);
  localStorage.removeItem(CLAIMS_KEY);
}

export function createSource({title, url, content}) {
  const normalizedContent = content.trim();
  const id = `src_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const normalizedUrl = normalizeUrl(url);
  return {
    id,
    title: title.trim() || new URL(normalizedUrl).hostname,
    url: normalizedUrl,
    source_type: "user_supplied_url",
    acquired_at: new Date().toISOString(),
    summary: summarize(normalizedContent),
    content: normalizedContent,
    quality: scoreSource({url, content: normalizedContent}),
  };
}

export function createDemoSource() {
  return createSource({
    title: "Basar demo source",
    url: "https://example.org/basar-demo-source",
    content: DEMO_SOURCE_TEXT,
  });
}

export function searchSources(sources, question, limit = 5) {
  const terms = tokenize(question);
  return sources
    .map((source) => ({source, rank: rankSource(source, terms)}))
    .filter((item) => item.rank > 0)
    .sort((a, b) => b.rank - a.rank || (b.source.quality?.score || 0) - (a.source.quality?.score || 0))
    .slice(0, limit)
    .map(({source}) => ({...source, excerpt: excerptFor(source.content, terms)}));
}

export async function askWithRouter({settings, question, evidence}) {
  if (!settings.routerEndpoint || !settings.apiKey || !settings.model) {
    return localAnswer(question, evidence);
  }

  let response;
  try {
    response = await fetch(`${settings.routerEndpoint.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You are Basar. Answer only from the provided sources. Cite source ids in brackets. State uncertainty when evidence is thin.",
          },
          {
            role: "user",
            content: `${question}\n\nSources:\n${JSON.stringify(evidence, null, 2)}`,
          },
        ],
      }),
    });
  } catch (err) {
    const error = new Error(err?.message || String(err));
    error.hint = routerFetchFailureHint(error.message);
    throw error;
  }

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = await response.json();
  return {
    answer: payload.choices?.[0]?.message?.content || "No answer returned by the selected 0G Router model.",
    citations: evidence.map((item) => item.id),
    evidence,
    uncertainty: "Generated through the user's configured Router/CORS-compatible endpoint.",
    provider: "0g-router",
    model: settings.model,
  };
}

export async function askManyRouters({profiles, question, evidence}) {
  const enabledProfiles = profiles.filter((profile) => profile.enabled);
  const settled = await Promise.allSettled(
    enabledProfiles.map((profile) =>
      askWithRouter({settings: profile, question, evidence}),
    ),
  );

  return settled.map((result, index) => {
    const profile = enabledProfiles[index];
    const createdAt = new Date().toISOString();
    if (result.status === "fulfilled") {
      return {
        profile_id: profile.id,
        profile_name: profile.name,
        provider: result.value.provider,
        model: result.value.model || profile.model,
        status: "fulfilled",
        answer: result.value.answer,
        citations: result.value.citations || [],
        evidence: result.value.evidence || evidence,
        uncertainty: result.value.uncertainty,
        created_at: createdAt,
      };
    }
    return {
      profile_id: profile.id,
      profile_name: profile.name,
      provider: "0g-router",
      model: profile.model,
      status: "rejected",
      answer: "",
      citations: [],
      evidence,
      error: result.reason?.message || String(result.reason),
      error_hint: result.reason?.hint || routerFetchFailureHint(result.reason?.message || String(result.reason)),
      created_at: createdAt,
    };
  });
}

export function buildGrowthPackage({sources, claims, settings, parallelReviews = []}) {
  const packagePayload = {
    schema: "basar.growth-package.v1",
    created_at: new Date().toISOString(),
    ecosystem: "0g",
    router_endpoint: settings.routerEndpoint,
    source_count: sources.length,
    claim_count: claims.length,
    sources: sources.map(({content, ...source}) => ({
      ...source,
      content,
      contribution_note: "User-controlled source contribution for 0G-backed knowledge growth.",
    })),
    claims,
  };

  if (parallelReviews.length) {
    packagePayload.parallel_reviews = parallelReviews.map((review) => ({
      question: review.question,
      profile_id: review.profile_id,
      profile_name: review.profile_name,
      provider: review.provider,
      model: review.model,
      status: review.status,
      answer: review.answer,
      citations: review.citations || [],
      evidence_ids: (review.evidence || []).map((item) => item.id),
      created_at: review.created_at,
      error: review.error,
    }));
  }

  return packagePayload;
}

export async function publishGrowthPackage({settings, payload}) {
  if (!settings.storageEndpoint) {
    throw new Error("Add a 0G Storage compatible endpoint first.");
  }

  const endpoint = settings.storageEndpoint.replace(/\/$/, "");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(settings.storageApiKey ? {Authorization: `Bearer ${settings.storageApiKey}`} : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const result = await response.json().catch(() => ({}));
  return extractStoragePointer(result);
}

export function extractStoragePointer(result) {
  return (
    result.uri ||
    result.rootHash ||
    result.root_hash ||
    result.hash ||
    result.id ||
    result.ref ||
    result.reference ||
    result.url ||
    result.location ||
    result.path ||
    "submitted"
  );
}

export function localAnswer(question, evidence) {
  if (!evidence.length) {
    return {
      answer: "No matching local sources were found in this browser library.",
      citations: [],
      evidence: [],
      uncertainty: "Add source text first, or configure a CORS-compatible Router endpoint or user-controlled local relay for model-assisted answers.",
      provider: "local",
      model: "local fallback",
    };
  }

  const citations = evidence.map((item) => item.id);
  return {
    answer: `Local evidence search found ${evidence.length} relevant source(s) for "${question}". Review the excerpts below before treating this as an answer. ${citations.map((id) => `[${id}]`).join(" ")}`,
    citations,
    evidence,
    uncertainty: "This is a local browser fallback, not model reasoning. Configure a CORS-compatible Router endpoint or user-controlled local relay for generated answers.",
    provider: "local",
    model: "local fallback",
  };
}

export function routerFetchFailureHint(message = "") {
  if (/failed to fetch|fetch failed|networkerror|load failed/i.test(message)) {
    return "Network or CORS failure. If you are calling 0G Router from a static browser page, use a CORS-compatible endpoint, a user-controlled local relay, or the future Direct wallet-signed path. This may not be an API key problem.";
  }
  return "";
}

export function extractClaims(sources) {
  return sources.flatMap((source) =>
    source.content
      .split(/[.!?]\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 60)
      .slice(0, 3)
      .map((claim, index) => ({
        id: `${source.id}_claim_${index + 1}`,
        claim,
        status: "needs_review",
        confidence: 0.45,
        source_id: source.id,
      })),
  );
}

function scoreSource({url, content}) {
  const reasons = [];
  let score = 35;
  if (url.startsWith("https://")) {
    score += 15;
    reasons.push("HTTPS source URL.");
  }
  if (content.length > 500) {
    score += 20;
    reasons.push("Substantial user-provided text.");
  }
  if (/\b(author|published|doi|archive|source|evidence)\b/i.test(content)) {
    score += 10;
    reasons.push("Text includes provenance-like terms.");
  }
  reasons.push("Stored only in this browser unless the user exports or syncs it.");
  return {
    score: Math.min(score, 90),
    tier: score >= 70 ? "usable source, verify important claims" : "needs more provenance",
    reasons,
    needs_verification: true,
  };
}

function normalizeUrl(url) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function summarize(content) {
  const first = content.replace(/\s+/g, " ").trim().slice(0, 220);
  return first ? `${first}${content.length > 220 ? "..." : ""}` : "No source text yet.";
}

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9_]{3,}/g) || []).filter(Boolean);
}

function rankSource(source, terms) {
  const haystack = `${source.title} ${source.url} ${source.content}`.toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function excerptFor(content, terms) {
  const compact = content.replace(/\s+/g, " ").trim();
  const lower = compact.toLowerCase();
  const index = terms.map((term) => lower.indexOf(term)).find((pos) => pos >= 0) ?? 0;
  const start = Math.max(0, index - 120);
  return compact.slice(start, start + 360);
}
