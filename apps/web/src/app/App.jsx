import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import BookOpen from "lucide-react/dist/esm/icons/book-open.js";
import BrainCircuit from "lucide-react/dist/esm/icons/brain-circuit.js";
import Database from "lucide-react/dist/esm/icons/database.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import FileQuestion from "lucide-react/dist/esm/icons/file-question.js";
import Gauge from "lucide-react/dist/esm/icons/gauge.js";
import Link from "lucide-react/dist/esm/icons/link.js";
import Settings from "lucide-react/dist/esm/icons/settings.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud.js";
import {downloadJson} from "../lib/export";
import {
  askManyRouters,
  askWithRouter,
  buildGrowthPackage,
  clearLibrary,
  createAiProfile,
  createDemoSource,
  createSource,
  extractClaims,
  loadAiProfiles,
  loadClaims,
  loadSettings,
  loadSources,
  publishGrowthPackage,
  saveAiProfiles,
  saveClaims,
  saveSettings,
  saveSources,
  searchSources,
} from "../lib/localLibrary";
import "./styles.css";

const tabs = [
  ["sources", Database, "Sources"],
  ["ask", FileQuestion, "Ask"],
  ["bench", BrainCircuit, "AI Bench"],
  ["claims", Gauge, "Claims"],
  ["settings", Settings, "Settings"],
];

function App() {
  const [tab, setTab] = useState("sources");
  const [sources, setSources] = useState([]);
  const [claims, setClaims] = useState([]);
  const [aiProfiles, setAiProfiles] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [benchQuestion, setBenchQuestion] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    routerEndpoint: "https://router-api.0g.ai/v1",
    model: "",
    apiKey: "",
    enabled: true,
  });
  const [answer, setAnswer] = useState(null);
  const [benchResults, setBenchResults] = useState([]);
  const [benchLastRunAt, setBenchLastRunAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [benchBusy, setBenchBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishedRef, setPublishedRef] = useState("");

  useEffect(() => {
    const loadedSources = loadSources();
    setSources(loadedSources);
    setClaims(loadClaims().length ? loadClaims() : extractClaims(loadedSources));
    setAiProfiles(loadAiProfiles());
  }, []);

  const storageMode = settings.apiKey && settings.model ? "0G Router ready" : "Local browser mode";
  const evidencePreview = useMemo(() => searchSources(sources, question || "evidence source", 3), [question, sources]);
  const growthPackage = useMemo(
    () => buildGrowthPackage({sources, claims, settings, parallelReviews: benchResults}),
    [benchResults, claims, settings, sources],
  );
  const routerConfigured = Boolean(settings.routerEndpoint && settings.model && settings.apiKey);
  const storageConfigured = Boolean(settings.storageEndpoint);
  const lastProvider = answer?.provider || "local";
  const lastModel = answer?.model || (routerConfigured ? settings.model : "local fallback");
  const enabledProfileCount = aiProfiles.filter((profile) => profile.enabled).length;
  const benchSuccessCount = benchResults.filter((result) => result.status === "fulfilled" && result.provider === "0g-router").length;
  const benchFailedCount = benchResults.filter((result) => result.status === "rejected").length;
  const averageScore = sources.length
    ? Math.round(sources.reduce((sum, source) => sum + (source.quality?.score || 0), 0) / sources.length)
    : 0;

  function persistSources(nextSources) {
    setSources(nextSources);
    saveSources(nextSources);
    const nextClaims = extractClaims(nextSources);
    setClaims(nextClaims);
    saveClaims(nextClaims);
  }

  function persistSettings(nextSettings) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }

  function persistAiProfiles(nextProfiles) {
    setAiProfiles(nextProfiles);
    saveAiProfiles(nextProfiles);
  }

  function submitSource(event) {
    event.preventDefault();
    setError("");
    try {
      const source = createSource({title, url, content});
      persistSources([source, ...sources]);
      setUrl("");
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message || "Unable to add source.");
    }
  }

  async function submitAsk(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setAnswer(null);
    try {
      const evidence = searchSources(sources, question, 5);
      setAnswer(await askWithRouter({settings, question, evidence}));
    } catch (err) {
      setError(`0G Router request failed: ${err.message || err}`);
    } finally {
      setBusy(false);
    }
  }

  function addProfile(event) {
    event.preventDefault();
    setError("");
    try {
      const profile = createAiProfile(profileDraft);
      persistAiProfiles([...aiProfiles, profile]);
      setProfileDraft({
        name: "",
        routerEndpoint: "https://router-api.0g.ai/v1",
        model: "",
        apiKey: "",
        enabled: true,
      });
    } catch (err) {
      setError(err.message || "Unable to add AI profile.");
    }
  }

  function updateProfile(profileId, patch) {
    persistAiProfiles(aiProfiles.map((profile) => (profile.id === profileId ? {...profile, ...patch} : profile)));
  }

  function removeProfile(profileId) {
    persistAiProfiles(aiProfiles.filter((profile) => profile.id !== profileId));
  }

  async function runBench(event) {
    event.preventDefault();
    setBenchBusy(true);
    setError("");
    setBenchResults([]);
    try {
      const evidence = searchSources(sources, benchQuestion, 5);
      const reviews = await askManyRouters({profiles: aiProfiles, question: benchQuestion, evidence});
      const questionStamped = reviews.map((review) => ({...review, question: benchQuestion}));
      setBenchResults(questionStamped);
      setBenchLastRunAt(new Date().toISOString());
    } catch (err) {
      setError(`AI Bench review failed: ${err.message || err}`);
    } finally {
      setBenchBusy(false);
    }
  }

  function exportLibrary() {
    downloadJson("basar-0g-growth-package.json", growthPackage);
  }

  async function publishTo0g(event) {
    event.preventDefault();
    setPublishing(true);
    setPublishedRef("");
    setError("");
    try {
      setPublishedRef(await publishGrowthPackage({settings, payload: growthPackage}));
    } catch (err) {
      setError(`0G Storage publish failed: ${err.message || err}`);
    } finally {
      setPublishing(false);
    }
  }

  function resetLibrary() {
    clearLibrary();
    persistSources([]);
    setAnswer(null);
    setBenchResults([]);
    setBenchLastRunAt("");
  }

  function loadDemoSource() {
    if (sources.some((source) => source.title === "Basar demo source")) {
      setTab("ask");
      setQuestion("What should Basar preserve?");
      setBenchQuestion("What should Basar preserve?");
      return;
    }
    const demo = createDemoSource();
    persistSources([demo, ...sources]);
    setTab("ask");
    setQuestion("What should Basar preserve?");
    setBenchQuestion("What should Basar preserve?");
  }

  return (
    <main>
      <aside>
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}basar-logo.png`} alt="Basar mark"/>
          <span>Basar</span>
        </div>
        <div className="ogBadge"><span>0G</span> ecosystem tool</div>
        <div className="status"><ShieldCheck size={16}/>{storageMode}</div>
        {tabs.map(([id, Icon, label]) => (
          <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}>
            <Icon size={18}/>{label}
          </button>
        ))}
      </aside>

      <section className="content">
        <header>
          <div>
            <h1>Basar</h1>
            <p>0G-first source preservation: local by default, user-owned Router compute, and portable growth packages for 0G storage.</p>
          </div>
          <div className="headerActions">
            <button onClick={loadDemoSource}><BookOpen size={17}/>Load demo</button>
            <button className="iconButton" onClick={exportLibrary} title="Export library">
              <Download size={18}/>
            </button>
          </div>
        </header>

        <div className="metricBar">
          <div><strong>{sources.length}</strong><span>Sources</span></div>
          <div><strong>{claims.length}</strong><span>Claim cards</span></div>
          <div><strong>{averageScore}</strong><span>Avg score</span></div>
          <div><strong>{storageMode}</strong><span>Compute mode</span></div>
        </div>

        <section className="proofPanel" aria-label="0G proof panel">
          <div className="proofTitle">
            <ShieldCheck size={20}/>
            <div>
              <h2>0G Proof Panel</h2>
              <p>Zero Cup path: user-owned Router inference plus growth package publishing.</p>
            </div>
          </div>
          <div className="proofGrid">
            <div className={routerConfigured ? "proofItem ready" : "proofItem"}>
              <span>Router configured</span>
              <strong>{routerConfigured ? "yes" : "no"}</strong>
            </div>
            <div className={lastProvider === "0g-router" ? "proofItem ready" : "proofItem"}>
              <span>Last provider</span>
              <strong>{lastProvider}</strong>
            </div>
            <div className="proofItem">
              <span>Last model</span>
              <strong>{lastModel}</strong>
            </div>
            <div className={storageConfigured ? "proofItem ready" : "proofItem"}>
              <span>Storage endpoint</span>
              <strong>{storageConfigured ? "configured" : "not set"}</strong>
            </div>
            <div className={publishedRef ? "proofItem ready wide" : "proofItem wide"}>
              <span>Last publish pointer</span>
              <strong>{publishedRef || "not published yet"}</strong>
            </div>
          </div>
          <p className="proofPrivacy">No shared backend key. Router and storage calls use only credentials entered in this browser.</p>
        </section>

        {error && <div className="notice error">{error}</div>}

        {tab === "sources" && (
          <section>
            <div className="onboarding">
              <img src={`${import.meta.env.BASE_URL}basar-logo.png`} alt="Basar"/>
              <div>
                <h2>Grow the 0G knowledge layer</h2>
                <p>Add lawful source text, ask with your own 0G Router key, then publish a growth package to your own 0G Storage endpoint so this library can move beyond one browser.</p>
              </div>
            </div>
            <form className="sourceForm" onSubmit={submitSource}>
              <div className="line">
                <Link size={18}/>
                <input placeholder="https://example.org/source" value={url} onChange={(e) => setUrl(e.target.value)} required />
                <input placeholder="Optional title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <button type="submit">Add</button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste public-domain, self-authored, licensed, or otherwise lawful source text here."
                required
              />
            </form>

            <div className="grid">
              {sources.map((source) => (
                <article className="card" key={source.id}>
                  <h2>{source.title}</h2>
                  <p>{source.summary}</p>
                  <div className="meta">{source.id} · score {source.quality?.score ?? 0}</div>
                  <ul>{(source.quality?.reasons || []).map((reason) => <li key={reason}>{reason}</li>)}</ul>
                </article>
              ))}
            </div>
            {!sources.length && (
              <article className="emptyCard">
                <BookOpen size={24}/>
                <h2>Start with a demo source</h2>
                <p>Use the built-in demo to test retrieval, claim extraction, and growth package export without adding private data.</p>
                <button onClick={loadDemoSource}>Load demo source</button>
              </article>
            )}
          </section>
        )}

        {tab === "ask" && (
          <section className="twoColumn">
            <form className="ask" onSubmit={submitAsk}>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about your saved sources" required />
              <div className="suggestions">
                {["What should Basar preserve?", "What is a growth package?", "Where does my data stay?"].map((prompt) => (
                  <button type="button" key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>
                ))}
              </div>
              <button type="submit" disabled={busy || !question.trim()}>{busy ? "Asking..." : "Ask Library"}</button>
            </form>
            <div className="panel">
              <h2>Evidence Preview</h2>
              {evidencePreview.map((item) => <p key={item.id}><strong>{item.title}</strong><br/>{item.excerpt}</p>)}
              {!evidencePreview.length && <p className="empty">Matching excerpts appear here before you ask.</p>}
            </div>
            {answer && (
              <article className="card answer">
                <h2>Answer</h2>
                <p>{answer.answer}</p>
                <div className="meta">Provider: {answer.provider} · Model: {answer.model} · Citations: {answer.citations.length ? answer.citations.join(", ") : "none"}</div>
                <h3>Evidence</h3>
                {answer.evidence.map((item) => <p key={item.id}><strong>{item.title}</strong>: {item.excerpt}</p>)}
                <h3>Uncertainty</h3>
                <p>{answer.uncertainty}</p>
              </article>
            )}
          </section>
        )}

        {tab === "bench" && (
          <section className="benchGrid">
            <article className="card featured">
              <h2><BrainCircuit size={18}/> AI Bench</h2>
              <p>Ask multiple 0G AI profiles the same question over the same Basar evidence package, then compare answer cards side by side.</p>
            </article>

            <article className="card benchProof">
              <h2><ShieldCheck size={18}/> 0G Proof Panel</h2>
              <div className="proofGrid compact">
                <div className={enabledProfileCount ? "proofItem ready" : "proofItem"}>
                  <span>Enabled profiles</span>
                  <strong>{enabledProfileCount}</strong>
                </div>
                <div className={benchSuccessCount ? "proofItem ready" : "proofItem"}>
                  <span>Successful providers</span>
                  <strong>{benchSuccessCount}</strong>
                </div>
                <div className={benchFailedCount ? "proofItem errorState" : "proofItem"}>
                  <span>Failed providers</span>
                  <strong>{benchFailedCount}</strong>
                </div>
                <div className="proofItem wide">
                  <span>Last run</span>
                  <strong>{benchLastRunAt || "not run yet"}</strong>
                </div>
              </div>
              <p className="proofPrivacy">Each selected AI profile independently used the same Basar evidence package.</p>
            </article>

            <form className="card profileForm" onSubmit={addProfile}>
              <h2>AI Profiles</h2>
              <div className="line profileLine">
                <input placeholder="Profile name" value={profileDraft.name} onChange={(e) => setProfileDraft({...profileDraft, name: e.target.value})} />
                <input placeholder="Router endpoint" value={profileDraft.routerEndpoint} onChange={(e) => setProfileDraft({...profileDraft, routerEndpoint: e.target.value})} required />
                <input placeholder="Model" value={profileDraft.model} onChange={(e) => setProfileDraft({...profileDraft, model: e.target.value})} required />
                <input type="password" placeholder="API key" value={profileDraft.apiKey} onChange={(e) => setProfileDraft({...profileDraft, apiKey: e.target.value})} required />
                <button type="submit">Add profile</button>
              </div>
              <p className="meta">Profiles are stored only in this browser. Do not paste shared or maintainer-owned keys.</p>
            </form>

            <section className="profileList">
              {aiProfiles.map((profile) => (
                <article className="card profileCard" key={profile.id}>
                  <label className="check">
                    <input type="checkbox" checked={profile.enabled} onChange={(e) => updateProfile(profile.id, {enabled: e.target.checked})} />
                    Enabled
                  </label>
                  <label>
                    Name
                    <input value={profile.name} onChange={(e) => updateProfile(profile.id, {name: e.target.value})} />
                  </label>
                  <label>
                    Router endpoint
                    <input value={profile.routerEndpoint} onChange={(e) => updateProfile(profile.id, {routerEndpoint: e.target.value})} />
                  </label>
                  <label>
                    Model
                    <input value={profile.model} onChange={(e) => updateProfile(profile.id, {model: e.target.value})} />
                  </label>
                  <label>
                    API key
                    <input type="password" value={profile.apiKey} onChange={(e) => updateProfile(profile.id, {apiKey: e.target.value})} />
                  </label>
                  <button type="button" className="danger" onClick={() => removeProfile(profile.id)}>Remove profile</button>
                </article>
              ))}
              {!aiProfiles.length && <p className="empty">Add at least two 0G Router profiles to run a parallel review.</p>}
            </section>

            <form className="ask benchAsk" onSubmit={runBench}>
              <textarea value={benchQuestion} onChange={(e) => setBenchQuestion(e.target.value)} placeholder="Ask one question across all enabled 0G AI profiles" required />
              <button type="submit" disabled={benchBusy || !benchQuestion.trim() || !enabledProfileCount}>
                {benchBusy ? "Running review..." : "Run Parallel Review"}
              </button>
            </form>

            <section className="answerGrid">
              {benchResults.map((result) => (
                <article className={`card answer ${result.status === "rejected" ? "failed" : ""}`} key={`${result.profile_id}_${result.created_at}`}>
                  <h2>{result.profile_name}</h2>
                  <div className="meta">Provider: {result.provider} · Model: {result.model} · Status: {result.status}</div>
                  {result.answer && <p>{result.answer}</p>}
                  {result.citations?.length > 0 && <p className="meta">Citations: {result.citations.join(", ")}</p>}
                  {result.uncertainty && <p>{result.uncertainty}</p>}
                  {result.error && <p className="errorText">{result.error}</p>}
                </article>
              ))}
            </section>
          </section>
        )}

        {tab === "claims" && (
          <section className="grid">
            {claims.map((claim) => (
              <article className="card" key={claim.id}>
                <h2>{claim.claim}</h2>
                <p className="meta">{claim.status} · confidence {claim.confidence} · {claim.source_id}</p>
              </article>
            ))}
            {!claims.length && <p className="empty">No claim cards yet. Claims are extracted locally from saved source text.</p>}
          </section>
        )}

        {tab === "settings" && (
          <section className="settingsGrid">
            <article className="card featured">
              <h2><span className="ogGlyph">0G</span> 0G Onboarding</h2>
              <ol>
                <li>Create or fund Router credit in the 0G Router console.</li>
                <li>Create a Router API key and choose a model.</li>
                <li>Paste the endpoint, model, and API key below.</li>
                <li>Add sources, ask questions, then publish a growth package to 0G Storage.</li>
              </ol>
              <div className="quickLinks">
                <a href="https://pc.0g.ai/" target="_blank" rel="noreferrer">Open 0G Router</a>
                <a href="https://docs.0g.ai/developer-hub/building-on-0g/compute-network/router/faq" target="_blank" rel="noreferrer">Router FAQ</a>
                <a href="https://docs.0g.ai/developer-hub/building-on-0g/storage" target="_blank" rel="noreferrer">Storage docs</a>
              </div>
            </article>

            <article className="card">
              <h2><BrainCircuit size={18}/> BYO 0G Router</h2>
              <label>
                Router endpoint
                <input value={settings.routerEndpoint} onChange={(e) => persistSettings({...settings, routerEndpoint: e.target.value})} />
              </label>
              <label>
                Model
                <input placeholder="Enter a model from your 0G Router account" value={settings.model} onChange={(e) => persistSettings({...settings, model: e.target.value})} />
              </label>
              <label>
                API key
                <input type="password" placeholder="Stored only in this browser if enabled" value={settings.apiKey} onChange={(e) => persistSettings({...settings, apiKey: e.target.value})} />
              </label>
              <label className="check">
                <input type="checkbox" checked={settings.persistApiKey} onChange={(e) => persistSettings({...settings, persistApiKey: e.target.checked})} />
                Keep API key in this browser
              </label>
            </article>

            <article className="card">
              <h2><UploadCloud size={18}/> 0G Growth Storage</h2>
              <p className="meta">Publish user-added sources as a portable JSON package to the user's own 0G Storage compatible endpoint.</p>
              <form className="publishForm" onSubmit={publishTo0g}>
                <label>
                  Storage endpoint
                  <input placeholder="https://your-0g-storage-gateway.example/upload" value={settings.storageEndpoint} onChange={(e) => persistSettings({...settings, storageEndpoint: e.target.value})} />
                </label>
                <label>
                  Storage API key
                  <input type="password" placeholder="Optional; stored only if enabled" value={settings.storageApiKey} onChange={(e) => persistSettings({...settings, storageApiKey: e.target.value})} />
                </label>
                <label className="check">
                  <input type="checkbox" checked={settings.persistStorageKey} onChange={(e) => persistSettings({...settings, persistStorageKey: e.target.checked})} />
                  Keep storage key in this browser
                </label>
                <div className="buttonRow">
                  <button type="button" onClick={exportLibrary}><Download size={16}/>Download growth package</button>
                  <button type="submit" disabled={publishing || !sources.length}>{publishing ? "Publishing..." : "Publish to 0G"}</button>
                </div>
              </form>
              {publishedRef && <div className="notice success">Published reference: {publishedRef}</div>}
            </article>

            <article className="card">
              <h2><ShieldCheck size={18}/> Privacy Boundary</h2>
              <p>This public build has no project backend. Sources stay in the user's browser unless they export data or configure their own 0G services.</p>
              <p>No traffic is sent to the developer machine. 0G Router calls use the endpoint and key entered by the current user.</p>
              <button className="danger" onClick={resetLibrary}><Trash2 size={16}/>Clear browser library</button>
            </article>
          </section>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
