import React, {useEffect, useState} from "react";
import {createRoot} from "react-dom/client";
import {BookOpen, Database, FileQuestion, Gauge, Link, Settings} from "lucide-react";
import {askLibrary, get0gHealth, getClaims, getSources, ingestUrl} from "../lib/api";
import "./styles.css";

function App() {
  const [tab, setTab] = useState("sources");
  const [sources, setSources] = useState([]);
  const [claims, setClaims] = useState([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [og, setOg] = useState(null);

  async function refresh() {
    setSources(await getSources());
    setClaims(await getClaims());
    setOg(await get0gHealth());
  }

  useEffect(() => { refresh().catch(() => {}); }, []);

  async function submitUrl(event) {
    event.preventDefault();
    await ingestUrl(url, title || undefined);
    setUrl("");
    setTitle("");
    await refresh();
  }

  async function submitAsk(event) {
    event.preventDefault();
    setAnswer(await askLibrary(question));
  }

  return (
    <main>
      <aside>
        <div className="brand"><BookOpen size={22}/> Hacker Librarian</div>
        <button className={tab === "sources" ? "active" : ""} onClick={() => setTab("sources")}><Database size={18}/>Sources</button>
        <button className={tab === "ask" ? "active" : ""} onClick={() => setTab("ask")}><FileQuestion size={18}/>Ask</button>
        <button className={tab === "claims" ? "active" : ""} onClick={() => setTab("claims")}><Gauge size={18}/>Claims</button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}><Settings size={18}/>Settings</button>
      </aside>
      <section className="content">
        <header>
          <h1>Local-first research librarian</h1>
          <p>Preserve sources, evaluate evidence, and trace claims back to verifiable records.</p>
        </header>

        {tab === "sources" && <section>
          <form className="toolbar" onSubmit={submitUrl}>
            <Link size={18}/>
            <input placeholder="https://example.org/source" value={url} onChange={e => setUrl(e.target.value)} required />
            <input placeholder="Optional title" value={title} onChange={e => setTitle(e.target.value)} />
            <button type="submit">Ingest URL</button>
          </form>
          <div className="grid">
            {sources.map(source => <article className="card" key={source.id}>
              <h2>{source.title}</h2>
              <p>{source.summary || "No summary yet."}</p>
              <div className="meta">{source.id} · {source.source_type} · score {source.quality?.score ?? 0}</div>
              <ul>{(source.quality?.reasons || []).map(reason => <li key={reason}>{reason}</li>)}</ul>
            </article>)}
            {!sources.length && <p className="empty">No sources yet. Ingest a URL or use the CLI to ingest a local file.</p>}
          </div>
        </section>}

        {tab === "ask" && <section>
          <form className="ask" onSubmit={submitAsk}>
            <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question about your local library" required />
            <button type="submit">Ask Library</button>
          </form>
          {answer && <article className="card answer">
            <h2>Answer</h2>
            <p>{answer.answer}</p>
            <div className="meta">Citations: {answer.citations.length ? answer.citations.join(", ") : "none"}</div>
            <h3>Evidence</h3>
            {answer.evidence.map(item => <p key={item.source_id}><strong>{item.title}</strong>: {item.excerpt}</p>)}
            <h3>Uncertainty</h3>
            <p>{answer.uncertainty}</p>
          </article>}
        </section>}

        {tab === "claims" && <section className="grid">
          {claims.map(claim => <article className="card" key={claim.id}><h2>{claim.claim}</h2><p>{claim.status} · confidence {claim.confidence}</p></article>)}
          {!claims.length && <p className="empty">No claim cards yet.</p>}
        </section>}

        {tab === "settings" && <section className="card">
          <h2>0G Optional Integration</h2>
          <pre>{JSON.stringify(og, null, 2)}</pre>
          <h2>Data Personalism</h2>
          <p>Data is memory, labor, context, dignity, and agency. AI assists research; it does not become the truth oracle.</p>
        </section>}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
