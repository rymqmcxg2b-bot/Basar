import React, {useEffect, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import BookOpen from "lucide-react/dist/esm/icons/book-open.js";
import BrainCircuit from "lucide-react/dist/esm/icons/brain-circuit.js";
import Download from "lucide-react/dist/esm/icons/download.js";
import Link from "lucide-react/dist/esm/icons/link.js";
import Settings from "lucide-react/dist/esm/icons/settings.js";
import ShieldCheck from "lucide-react/dist/esm/icons/shield-check.js";
import Trash2 from "lucide-react/dist/esm/icons/trash-2.js";
import UploadCloud from "lucide-react/dist/esm/icons/upload-cloud.js";
import {downloadJson} from "../lib/export";
import {
  askManyRouters,
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

const views = [
  ["review", BrainCircuit, "Review"],
  ["library", BookOpen, "Library"],
  ["profiles", Settings, "Profiles"],
];

function App() {
  const [view, setView] = useState("review");
  const [sources, setSources] = useState([]);
  const [claims, setClaims] = useState([]);
  const [aiProfiles, setAiProfiles] = useState([]);
  const [settings, setSettings] = useState(loadSettings);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [reviewQuestion, setReviewQuestion] = useState("");
  const [profileDraft, setProfileDraft] = useState({
    name: "",
    routerEndpoint: "https://router-api.0g.ai/v1",
    model: "",
    apiKey: "",
    enabled: true,
  });
  const [reviewResults, setReviewResults] = useState([]);
  const [reviewLastRunAt, setReviewLastRunAt] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishedRef, setPublishedRef] = useState("");

  useEffect(() => {
    const loadedSources = loadSources();
    const loadedClaims = loadClaims();
    setSources(loadedSources);
    setClaims(loadedClaims.length ? loadedClaims : extractClaims(loadedSources));
    setAiProfiles(loadAiProfiles());
  }, []);

  const enabledProfiles = useMemo(
    () => aiProfiles.filter((profile) => profile.enabled),
    [aiProfiles],
  );
  const enabledProfileCount = enabledProfiles.length;
  const reviewEvidencePreview = useMemo(() => {
    if (reviewQuestion.trim()) {
      return searchSources(sources, reviewQuestion, 5);
    }
    return sources.slice(0, 5).map((source) => ({
      ...source,
      excerpt: source.summary || source.content.slice(0, 240),
    }));
  }, [reviewQuestion, sources]);
  const growthPackage = useMemo(
    () => buildGrowthPackage({sources, claims, settings, parallelReviews: reviewResults}),
    [claims, reviewResults, settings, sources],
  );
  const successfulProviderCount = reviewResults.filter(
    (result) => result.status === "fulfilled" && result.provider === "0g-router",
  ).length;
  const failedProviderCount = reviewResults.filter((result) => result.status === "rejected").length;
  const storageConfigured = Boolean(settings.storageEndpoint);
  const packageReviewCount = growthPackage.parallel_reviews?.length || 0;

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

  async function runReview(event) {
    event.preventDefault();
    setReviewBusy(true);
    setError("");
    setReviewResults([]);
    try {
      const evidence = searchSources(sources, reviewQuestion, 5);
      const reviews = await askManyRouters({profiles: aiProfiles, question: reviewQuestion, evidence});
      const questionStamped = reviews.map((review) => ({...review, question: reviewQuestion}));
      setReviewResults(questionStamped);
      setReviewLastRunAt(new Date().toISOString());
    } catch (err) {
      setError(`Parallel review failed: ${err.message || err}`);
    } finally {
      setReviewBusy(false);
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
    setReviewResults([]);
    setReviewLastRunAt("");
  }

  function loadDemoSource() {
    if (!sources.some((source) => source.title === "Basar demo source")) {
      const demo = createDemoSource();
      persistSources([demo, ...sources]);
    }
    setView("review");
    setReviewQuestion("How does Basar use 0G?");
  }

  function shortEvidenceText(source) {
    return source.excerpt || source.summary || source.content?.slice(0, 240) || "";
  }

  return (
    <main className="workspace">
      <header className="workspaceHeader">
        <div className="identity">
          <div className="brandLine">
            <img src={`${import.meta.env.BASE_URL}basar-mark.png`} alt="" aria-hidden="true"/>
            <span>Basar</span>
          </div>
          <h1>Add sources once. Review with many AIs. Keep the evidence.</h1>
          <p>Same sources. Multiple 0G AI reviews. Portable evidence memory.</p>
        </div>
        <div className="topActions">
          <button type="button" className="secondary" onClick={loadDemoSource}>Load demo source</button>
          <button type="button" onClick={exportLibrary}>
            <Download size={16}/>
            Download growth package
          </button>
        </div>
      </header>

      <nav className="primaryNav" aria-label="Primary">
        {views.map(([id, Icon, label]) => (
          <button className={view === id ? "active" : ""} key={id} onClick={() => setView(id)}>
            <Icon size={16}/>
            {label}
          </button>
        ))}
      </nav>

      {error && <div className="notice error">{error}</div>}

      {view === "review" && (
        <section className="viewStack" aria-label="Review workspace">
          <section className="flowSection" aria-labelledby="review-sources">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Evidence</p>
                <h2 id="review-sources">Sources</h2>
              </div>
              <button type="button" className="secondary" onClick={loadDemoSource}>Load demo source</button>
            </div>

            <form className="sourceForm" onSubmit={submitSource}>
              <div className="sourceLine">
                <Link size={16}/>
                <input placeholder="https://example.org/source" value={url} onChange={(event) => setUrl(event.target.value)} required />
                <input placeholder="Optional title" value={title} onChange={(event) => setTitle(event.target.value)} />
                <button type="submit">Add source</button>
              </div>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Paste lawful source text here."
                required
              />
            </form>

            <div className="sourceGrid compactGrid">
              {reviewEvidencePreview.map((source) => (
                <article className="sourceCard" key={source.id}>
                  <div className="cardKicker">{source.id}</div>
                  <h3>{source.title}</h3>
                  <p>{shortEvidenceText(source)}</p>
                  <span>Score {source.quality?.score ?? 0}</span>
                </article>
              ))}
            </div>
            {!reviewEvidencePreview.length && (
              <p className="emptyText">No matching source text yet. Add a source or load the demo source.</p>
            )}
          </section>

          <section className="flowSection" aria-labelledby="review-question">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">AI Bench / Parallel Review</p>
                <h2 id="review-question">Run review</h2>
              </div>
              <span className="smallStatus">Enabled AI profiles: {enabledProfileCount}</span>
            </div>

            <form className="reviewForm" onSubmit={runReview}>
              <textarea
                value={reviewQuestion}
                onChange={(event) => setReviewQuestion(event.target.value)}
                placeholder="Ask one question over the selected sources..."
                required
              />
              <div className="runRow">
                <div className="profileSummary">
                  {enabledProfiles.length
                    ? enabledProfiles.map((profile) => <span key={profile.id}>{profile.name}</span>)
                    : <span>No enabled profiles</span>}
                </div>
                <button type="submit" disabled={reviewBusy || !reviewQuestion.trim() || !enabledProfileCount}>
                  {reviewBusy ? "Running review..." : "Run review"}
                </button>
              </div>
            </form>
          </section>

          <section className="flowSection" aria-labelledby="review-cards">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Reviews</p>
                <h2 id="review-cards">Answer cards</h2>
              </div>
              <span className="smallStatus">{reviewResults.length} cards</span>
            </div>

            <div className="answerGrid">
              {reviewResults.map((result) => (
                <article className={`answerCard ${result.status === "rejected" ? "failed" : ""}`} key={`${result.profile_id}_${result.created_at}`}>
                  <div className="answerHeader">
                    <div>
                      <h3>{result.profile_name}</h3>
                      <p>{result.provider} / {result.model}</p>
                    </div>
                    <span className={`statusPill ${result.status}`}>{result.status}</span>
                  </div>
                  {result.answer && <p className="answerText">{result.answer}</p>}
                  {result.citations?.length > 0 && (
                    <p className="metaLine">Citations: {result.citations.join(", ")}</p>
                  )}
                  {result.evidence?.length > 0 && (
                    <p className="metaLine">Evidence: {result.evidence.map((item) => item.id).join(", ")}</p>
                  )}
                  {result.uncertainty && <p className="quietLine">{result.uncertainty}</p>}
                  {result.error && <p className="errorText">{result.error}</p>}
                </article>
              ))}
            </div>
            {!reviewResults.length && (
              <p className="emptyText">Run a review to compare one answer card per enabled 0G AI profile.</p>
            )}
          </section>

          <section className="proofPanel" aria-label="0G Proof Panel">
            <div className="proofHeader">
              <ShieldCheck size={18}/>
              <div>
                <p className="eyebrow">Proof</p>
                <h2>0G Proof Panel</h2>
              </div>
            </div>
            <div className="proofGrid">
              <div>
                <span>Enabled profiles</span>
                <strong>{enabledProfileCount}</strong>
              </div>
              <div>
                <span>Successful providers</span>
                <strong>{successfulProviderCount}</strong>
              </div>
              <div>
                <span>Failed providers</span>
                <strong>{failedProviderCount}</strong>
              </div>
              <div>
                <span>Last run</span>
                <strong>{reviewLastRunAt || "Not run yet"}</strong>
              </div>
            </div>
            <p>Each selected AI profile independently used the same Basar evidence package.</p>
          </section>

          <section className="flowSection exportSection" aria-labelledby="review-export">
            <div>
              <p className="eyebrow">Export</p>
              <h2 id="review-export">Growth package</h2>
              <p>Exports sources, claims, answer cards, and parallel_reviews as basar.growth-package.v1.</p>
            </div>
            <button type="button" onClick={exportLibrary}>
              <Download size={16}/>
              Download growth package
            </button>
          </section>
        </section>
      )}

      {view === "library" && (
        <section className="viewStack" aria-label="Library">
          <section className="flowSection">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Library</p>
                <h2>Sources</h2>
              </div>
              <span className="smallStatus">{sources.length} saved</span>
            </div>
            <div className="sourceGrid">
              {sources.map((source) => (
                <article className="sourceCard" key={source.id}>
                  <div className="cardKicker">{source.id}</div>
                  <h3>{source.title}</h3>
                  <p>{source.summary}</p>
                  <span>{source.url} / score {source.quality?.score ?? 0}</span>
                </article>
              ))}
            </div>
            {!sources.length && <p className="emptyText">No sources saved yet.</p>}
          </section>

          <section className="flowSection">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Evidence</p>
                <h2>Claims</h2>
              </div>
              <span className="smallStatus">{claims.length} cards</span>
            </div>
            <div className="claimGrid">
              {claims.map((claim) => (
                <article className="claimCard" key={claim.id}>
                  <h3>{claim.claim}</h3>
                  <p>{claim.status} / confidence {claim.confidence} / {claim.source_id}</p>
                </article>
              ))}
            </div>
            {!claims.length && <p className="emptyText">No claim cards yet. Claims are extracted locally from saved source text.</p>}
          </section>

          <section className="flowSection exportSection">
            <div>
              <p className="eyebrow">Saved evidence</p>
              <h2>Preservation record</h2>
              <p>{sources.length} sources, {claims.length} claims, {packageReviewCount} parallel review records.</p>
              {publishedRef && <p className="quietLine">Last published reference: {publishedRef}</p>}
            </div>
            <button type="button" onClick={exportLibrary}>
              <Download size={16}/>
              Download growth package
            </button>
          </section>
        </section>
      )}

      {view === "profiles" && (
        <section className="viewStack" aria-label="Profiles">
          <section className="flowSection">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Profiles</p>
                <h2>AI reviewers</h2>
              </div>
              <span className="smallStatus">{enabledProfileCount} enabled</span>
            </div>
            <p className="helperText">Profiles are stored browser-locally. Users provide their own 0G Router credentials.</p>

            <form className="profileForm" onSubmit={addProfile}>
              <input placeholder="Profile name" value={profileDraft.name} onChange={(event) => setProfileDraft({...profileDraft, name: event.target.value})} />
              <input placeholder="Router endpoint" value={profileDraft.routerEndpoint} onChange={(event) => setProfileDraft({...profileDraft, routerEndpoint: event.target.value})} required />
              <input placeholder="Model" value={profileDraft.model} onChange={(event) => setProfileDraft({...profileDraft, model: event.target.value})} required />
              <input type="password" placeholder="API key" value={profileDraft.apiKey} onChange={(event) => setProfileDraft({...profileDraft, apiKey: event.target.value})} required autoComplete="off" />
              <button type="submit">Add profile</button>
            </form>

            <div className="profileGrid">
              {aiProfiles.map((profile) => (
                <article className="profileCard" key={profile.id}>
                  <div className="profileCardHeader">
                    <label className="check">
                      <input type="checkbox" checked={profile.enabled} onChange={(event) => updateProfile(profile.id, {enabled: event.target.checked})} />
                      Enabled
                    </label>
                    <button type="button" className="textButton dangerText" onClick={() => removeProfile(profile.id)}>Remove</button>
                  </div>
                  <label>
                    Name
                    <input value={profile.name} onChange={(event) => updateProfile(profile.id, {name: event.target.value})} />
                  </label>
                  <label>
                    Endpoint
                    <input value={profile.routerEndpoint} onChange={(event) => updateProfile(profile.id, {routerEndpoint: event.target.value})} />
                  </label>
                  <label>
                    Model
                    <input value={profile.model} onChange={(event) => updateProfile(profile.id, {model: event.target.value})} />
                  </label>
                  <label>
                    API key
                    <input type="password" value={profile.apiKey} onChange={(event) => updateProfile(profile.id, {apiKey: event.target.value})} autoComplete="off" />
                  </label>
                </article>
              ))}
            </div>
            {!aiProfiles.length && <p className="emptyText">Add at least two 0G Router profiles to run a parallel review.</p>}
          </section>

          <section className="flowSection settingsSection">
            <div>
              <p className="eyebrow">Profiles</p>
              <h2>Default Router settings</h2>
            </div>
            <div className="settingsGrid">
              <label>
                Router endpoint
                <input value={settings.routerEndpoint} onChange={(event) => persistSettings({...settings, routerEndpoint: event.target.value})} />
              </label>
              <label>
                Model
                <input placeholder="Enter a model from your 0G Router account" value={settings.model} onChange={(event) => persistSettings({...settings, model: event.target.value})} />
              </label>
              <label>
                API key
                <input type="password" placeholder="Stored only in this browser if enabled" value={settings.apiKey} onChange={(event) => persistSettings({...settings, apiKey: event.target.value})} autoComplete="off" />
              </label>
              <label className="check">
                <input type="checkbox" checked={settings.persistApiKey} onChange={(event) => persistSettings({...settings, persistApiKey: event.target.checked})} />
                Keep API key in this browser
              </label>
            </div>
          </section>

          <section className="flowSection settingsSection">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Export</p>
                <h2>0G growth storage</h2>
              </div>
              <span className={storageConfigured ? "smallStatus ready" : "smallStatus"}>{storageConfigured ? "Configured" : "Not configured"}</span>
            </div>
            <form className="publishForm" onSubmit={publishTo0g}>
              <label>
                Storage endpoint
                <input placeholder="https://your-0g-storage-gateway.example/upload" value={settings.storageEndpoint} onChange={(event) => persistSettings({...settings, storageEndpoint: event.target.value})} />
              </label>
              <label>
                Storage API key
                <input type="password" placeholder="Optional; stored only if enabled" value={settings.storageApiKey} onChange={(event) => persistSettings({...settings, storageApiKey: event.target.value})} autoComplete="off" />
              </label>
              <label className="check">
                <input type="checkbox" checked={settings.persistStorageKey} onChange={(event) => persistSettings({...settings, persistStorageKey: event.target.checked})} />
                Keep storage key in this browser
              </label>
              <div className="buttonRow">
                <button type="button" className="secondary" onClick={exportLibrary}>
                  <Download size={16}/>
                  Download growth package
                </button>
                <button type="submit" disabled={publishing || !sources.length}>
                  <UploadCloud size={16}/>
                  {publishing ? "Publishing..." : "Publish to 0G"}
                </button>
              </div>
            </form>
            {publishedRef && <div className="notice success">Published reference: {publishedRef}</div>}
          </section>

          <section className="flowSection privacySection">
            <div>
              <p className="eyebrow">Boundary</p>
              <h2>Browser-local storage</h2>
              <p>Sources stay in this browser unless the user exports data or configures their own 0G services.</p>
            </div>
            <button type="button" className="dangerButton" onClick={resetLibrary}>
              <Trash2 size={16}/>
              Clear browser library
            </button>
          </section>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
