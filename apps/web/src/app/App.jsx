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
  Trash2,
} from "lucide-react";
import {downloadJson} from "../lib/export";
import {
  askWithRouter,
  clearLibrary,
  createSource,
  extractClaims,
  loadClaims,
  loadSettings,
  loadSources,
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
  const [error, setError] = useState("");

  useEffect(() => {
    const loadedSources = loadSources();
    setSources(loadedSources);
    setClaims(loadClaims().length ? loadClaims() : extractClaims(loadedSources));
  }, []);

  const storageMode = settings.apiKey && settings.model ? "0G Router ready" : "Local browser mode";
  const evidencePreview = useMemo(() => searchSources(sources, question || "evidence source", 3), [question, sources]);

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
    downloadJson("hacker-librarian-browser-export.json", {
      exported_at: new Date().toISOString(),
      mode: "browser-byo-0g",
      sources,
      claims,
      router_endpoint: settings.routerEndpoint,
    });
  }

  function resetLibrary() {
    clearLibrary();
    persistSources([]);
    setAnswer(null);
  }

  return (
    <main>
      <aside>
        <div className="brand"><BookOpen size={22}/> Hacker Librarian</div>
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
            <p>Source-preserving research in the user's browser, with optional user-owned 0G Router compute.</p>
          </div>
          <button className="iconButton" onClick={exportLibrary} title="Export library">
            <Download size={18}/>
          </button>
        </header>

        {error && <div className="notice error">{error}</div>}

        {tab === "sources" && (
          <section>
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
