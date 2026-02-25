import React, { useState, useEffect } from "react";
import { aspirationsApi } from "../api/client.js";

const styles = {
  container: { maxWidth: "700px", margin: "0 auto", padding: "32px 20px" },
  heading: { fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "#1a1a2e" },
  subtitle: { fontSize: "14px", color: "#666", marginBottom: "32px" },
  form: {
    background: "#fff",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  formTitle: { fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#1a1a2e" },
  label: { display: "block", fontSize: "13px", fontWeight: 600, color: "#444", marginBottom: "6px" },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    marginBottom: "14px",
    outline: "none",
    transition: "border-color 0.15s",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    marginBottom: "14px",
    outline: "none",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
  },
  btn: (variant) => ({
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    background: variant === "primary" ? "#e94560" : variant === "danger" ? "#fde8e7" : "#f0f0f0",
    color: variant === "primary" ? "#fff" : variant === "danger" ? "#c0392b" : "#444",
    transition: "opacity 0.15s",
  }),
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px 24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
  },
  cardTitle: { fontSize: "16px", fontWeight: 700, color: "#1a1a2e", marginBottom: "4px" },
  cardDesc: { fontSize: "13px", color: "#666" },
  cardActions: { display: "flex", gap: "8px", flexShrink: 0, marginTop: "4px" },
  empty: { textAlign: "center", color: "#aaa", padding: "40px 0", fontSize: "14px" },
  error: { color: "#c0392b", fontSize: "13px", marginBottom: "10px" },
  editInput: {
    width: "100%",
    padding: "6px 10px",
    borderRadius: "6px",
    border: "1.5px solid #ddd",
    fontSize: "14px",
    marginBottom: "8px",
    fontFamily: "inherit",
  },
};

export default function Aspirations() {
  const [aspirations, setAspirations] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const load = async () => {
    const { data } = await aspirationsApi.list();
    setAspirations(data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    setError("");
    try {
      await aspirationsApi.create({ title: title.trim(), description: description.trim() || null });
      setTitle("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to add aspiration.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this career goal and all its tracked opportunities?")) return;
    try {
      await aspirationsApi.delete(id);
      await load();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  const handleEditSave = async (id) => {
    if (!editTitle.trim()) return;
    try {
      await aspirationsApi.update(id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      });
      setEditId(null);
      await load();
    } catch (err) {
      alert("Failed to update.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Career Goals</h1>
      <p style={styles.subtitle}>
        Define the roles or career paths you're interested in. Claude will analyze news against these goals.
      </p>

      <div style={styles.form}>
        <div style={styles.formTitle}>Add a Career Goal</div>
        <form onSubmit={handleAdd}>
          {error && <div style={styles.error}>{error}</div>}
          <label style={styles.label}>Role title or career path *</label>
          <input
            style={styles.input}
            placeholder="e.g. Senior Product Manager, ML Engineer, VC Analyst"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <label style={styles.label}>Additional context (optional)</label>
          <textarea
            style={styles.textarea}
            placeholder="e.g. Interested in fintech or healthcare AI. Open to remote roles at Series B+ startups."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit" style={styles.btn("primary")} disabled={loading}>
            {loading ? "Adding..." : "Add Goal"}
          </button>
        </form>
      </div>

      <div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: "#1a1a2e", marginBottom: "16px" }}>
          Your Goals ({aspirations.length})
        </div>
        {aspirations.length === 0 ? (
          <div style={styles.empty}>No career goals yet. Add one above to get started.</div>
        ) : (
          <div style={styles.list}>
            {aspirations.map((asp) => (
              <div key={asp.id} style={styles.card}>
                {editId === asp.id ? (
                  <div style={{ flex: 1 }}>
                    <input
                      style={styles.editInput}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                    <textarea
                      style={{ ...styles.editInput, minHeight: "60px", resize: "vertical" }}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Additional context (optional)"
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button style={styles.btn("primary")} onClick={() => handleEditSave(asp.id)}>
                        Save
                      </button>
                      <button style={styles.btn("default")} onClick={() => setEditId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={styles.cardTitle}>{asp.title}</div>
                      {asp.description && (
                        <div style={styles.cardDesc}>{asp.description}</div>
                      )}
                    </div>
                    <div style={styles.cardActions}>
                      <button
                        style={styles.btn("default")}
                        onClick={() => {
                          setEditId(asp.id);
                          setEditTitle(asp.title);
                          setEditDescription(asp.description || "");
                        }}
                      >
                        Edit
                      </button>
                      <button style={styles.btn("danger")} onClick={() => handleDelete(asp.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
