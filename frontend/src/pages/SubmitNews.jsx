import React, { useState, useRef } from "react";
import { newsApi } from "../api/client.js";
import OpportunityCard from "../components/OpportunityCard.jsx";

const styles = {
  container: { maxWidth: "700px", margin: "0 auto", padding: "32px 20px" },
  heading: { fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#1a1a2e" },
  subtitle: { fontSize: "14px", color: "#666", marginBottom: "32px" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  tabs: { display: "flex", gap: "4px", marginBottom: "24px" },
  tab: (active) => ({
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    background: active ? "#1a1a2e" : "#f0f0f0",
    color: active ? "#fff" : "#555",
    transition: "all 0.15s",
  }),
  label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#444", marginBottom: "8px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
    resize: "vertical",
    minHeight: "180px",
    fontFamily: "inherit",
  },
  btn: (variant, disabled) => ({
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: 600,
    background: disabled ? "#ccc" : variant === "primary" ? "#e94560" : "#f0f0f0",
    color: disabled ? "#888" : variant === "primary" ? "#fff" : "#444",
    transition: "opacity 0.15s",
  }),
  dropzone: (dragging) => ({
    border: `2px dashed ${dragging ? "#e94560" : "#ddd"}`,
    borderRadius: "10px",
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    background: dragging ? "#fff0f2" : "#fafafa",
    marginBottom: "16px",
    transition: "all 0.15s",
  }),
  dropText: { fontSize: "14px", color: "#888", marginTop: "8px" },
  fileName: { fontSize: "13px", color: "#444", fontWeight: 600, marginTop: "4px" },
  error: { color: "#c0392b", fontSize: "13px", marginTop: "8px", padding: "8px 12px", background: "#fde8e7", borderRadius: "6px" },
  success: {
    padding: "12px 16px",
    background: "#eafaf1",
    border: "1px solid #27ae60",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#1a6e3c",
    marginTop: "12px",
  },
  resultsTitle: { fontSize: "18px", fontWeight: 700, color: "#1a1a2e", marginBottom: "4px" },
  resultsSubtitle: { fontSize: "13px", color: "#666", marginBottom: "20px" },
};

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "14px",
        height: "14px",
        border: "2px solid rgba(255,255,255,0.4)",
        borderTop: "2px solid #fff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
        marginRight: "8px",
        verticalAlign: "middle",
      }}
    />
  );
}

export default function SubmitNews({ onNewOpportunities }) {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInputRef = useRef();

  const reset = () => { setError(""); setResult(null); };

  const handleSubmit = async () => {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      let resp;
      if (tab === "url") {
        if (!url.trim()) throw new Error("Please enter a URL.");
        resp = await newsApi.submitUrl(url.trim());
      } else if (tab === "text") {
        if (!text.trim()) throw new Error("Please paste some text.");
        resp = await newsApi.submitText(text.trim());
      } else {
        if (!imageFile) throw new Error("Please select an image.");
        resp = await newsApi.submitImage(imageFile);
      }
      setResult(resp.data);
      if (onNewOpportunities) onNewOpportunities();
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || "Submission failed.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) setImageFile(file);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Submit News</h1>
      <p style={styles.subtitle}>
        Paste a URL, article text, or upload a screenshot. Claude will find relevant opportunities.
      </p>

      <div style={styles.card}>
        <div style={styles.tabs}>
          {["url", "text", "image"].map((t) => (
            <button key={t} style={styles.tab(tab === t)} onClick={() => { setTab(t); reset(); }}>
              {t === "url" ? "URL" : t === "text" ? "Paste Text" : "Image"}
            </button>
          ))}
        </div>

        {tab === "url" && (
          <div>
            <label style={styles.label}>Article or news URL</label>
            <input
              style={styles.input}
              placeholder="https://techcrunch.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>
        )}

        {tab === "text" && (
          <div>
            <label style={styles.label}>Paste article or news text</label>
            <textarea
              style={styles.textarea}
              placeholder="Paste the full article text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
        )}

        {tab === "image" && (
          <div>
            <label style={styles.label}>Upload screenshot or image</label>
            <div
              style={styles.dropzone(dragging)}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <div style={{ fontSize: "32px" }}>📎</div>
              <div style={styles.dropText}>
                {imageFile ? (
                  <span style={styles.fileName}>{imageFile.name}</span>
                ) : (
                  "Drag & drop an image, or click to browse"
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => setImageFile(e.target.files[0])}
            />
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button
          style={styles.btn("primary", loading)}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading && <Spinner />}
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {result && (
        <div>
          <div style={styles.resultsTitle}>
            {result.opportunities_created === 0
              ? "No opportunities found"
              : `${result.opportunities_created} opportunit${result.opportunities_created === 1 ? "y" : "ies"} found`}
          </div>
          <p style={styles.resultsSubtitle}>
            {result.opportunities_created === 0
              ? "This news didn't match any of your career goals. Try adding more goals or submitting different content."
              : "These opportunities have been added to your dashboard."}
          </p>
          {result.opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}
    </div>
  );
}
