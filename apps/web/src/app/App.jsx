import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  BookOpen,
  BrainCircuit,
  Database,
  Download,
  FileQuestion,
  Gauge,
  Link,
  Settings,
  ShieldCheck,
  UploadCloud,
  Trash2,
} from "lucide-react";
import {downloadJson} from "../lib/export";
import {
  askWithRouter,
  buildGrowthPackage,
  clearLibrary,
  createSource,
  extractClaims,
  loadClaims,
  loadSettings,
  loadSources,
  publishGrowthPackage,
  saveClaims,
  saveSettings,
  saveSources,
  searchSources,
} from "../lib/localLibrary";
import "./styles.css";

const tabs = [
  ["sources", Database, "Sources"],
  ["ask", FileQuestion, "Ask"],
  ["claims", Gauge, "Claims"],
  ["settings", Settings, "Settings"],
];

function App() {
  const [tab, setTab] = useState("sources");
  const [sources, setSources] = useState([]);
  const [claims, setClaims] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishedRef, setPublishedRef] = useState("");

  useEffect(() => {
    const loadedSources = loadSources();
    setSources(loadedSources);
    setClaims(loadClaims().length ? loadClaims() : extractClaims(loadedSources));
  }, []);

  const storageMode = settings.apiKey && settings.model ? "0G Router ready" : "Local browser mode";
  const evidencePreview = useMemo(() => searchSources(sources, question || "evidence source", 3), [question, sources]);
  const growthPackage = useMemo(() => buildGrowthPackage({sources, claims, settings}), [claims, settings, sources]);

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

  function exportLibrary() {
    downloadJson("hacker-librarian-0g-growth-package.json", growthPackage);
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
  }

  return (
    <main>
      <aside>
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}hacker-librarian-mark.png`} alt="Hacker Librarian mark"/>
          <span>Hacker Librarian</span>
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
            <h1>Hacker Librarian</h1>
            <p>0G-first source preservation: local by default, user-owned Router compute, and portable growth packages for 0G storage.</p>
          </div>
          <button className="iconButton" onClick={exportLibrary} title="Export library">
            <Download size={18}/>
          </button>
        </header>

        {error && <div className="notice error">{error}</div>}

        {tab === "sources" && (
          <section>
            <div className="onboarding">
              <img src={`${import.meta.env.BASE_URL}hacker-librarian-mark.png`} alt="Hacker Librarian"/>
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
              {!sources.length && <p className="empty">No sources yet. Add source text to build a browser-local library.</p>}
            </div>
          </section>
        )}

        {tab === "ask" && (
          <section className="twoColumn">
            <form className="ask" onSubmit={submitAsk}>
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question about your saved sources" required />
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
                <div className="meta">Provider: {answer.provider} · Citations: {answer.citations.length ? answer.citations.join(", ") : "none"}</div>
                <h3>Evidence</h3>
                {answer.evidence.map((item) => <p key={item.id}><strong>{item.title}</strong>: {item.excerpt}</p>)}
                <h3>Uncertainty</h3>
                <p>{answer.uncertainty}</p>
              </article>
            )}
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
