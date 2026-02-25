import React, { useState } from "react";

const URGENCY_CONFIG = {
  apply_now: { label: "Apply Now", color: "#c0392b", bg: "#fde8e7" },
  watch_space: { label: "Watch Space", color: "#d68910", bg: "#fef9e7" },
  informational: { label: "Informational", color: "#2471a3", bg: "#ebf5fb" },
};

const styles = {
  card: {
    background: "#fff",
    borderRadius: "10px",
    padding: "16px 20px",
    marginBottom: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    borderLeft: "4px solid transparent",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  company: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  roleHint: {
    fontSize: "13px",
    color: "#555",
    marginTop: "2px",
  },
  badge: (color, bg) => ({
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    color,
    background: bg,
    whiteSpace: "nowrap",
    flexShrink: 0,
    marginLeft: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  summary: {
    fontSize: "14px",
    color: "#333",
    lineHeight: "1.6",
    marginBottom: "10px",
  },
  nextStepsLabel: {
    fontSize: "11px",
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  nextSteps: {
    fontSize: "13px",
    color: "#1a6e3c",
    fontWeight: 500,
    lineHeight: "1.5",
  },
  footer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: "12px",
    paddingTop: "10px",
    borderTop: "1px solid #f0f0f0",
  },
  scoreBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    color: "#888",
  },
  barTrack: {
    width: "80px",
    height: "4px",
    background: "#eee",
    borderRadius: "2px",
    overflow: "hidden",
  },
  barFill: (score) => ({
    height: "100%",
    width: `${Math.round(score * 100)}%`,
    background: score > 0.7 ? "#27ae60" : score > 0.4 ? "#f39c12" : "#95a5a6",
    borderRadius: "2px",
  }),
  sourceLink: {
    fontSize: "12px",
    color: "#3498db",
    textDecoration: "none",
  },
  overrideRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid #f0f0f0",
  },
  overrideLabel: {
    fontSize: "11px",
    color: "#aaa",
    marginRight: "2px",
    whiteSpace: "nowrap",
  },
  overrideBtn: (isActive, color, bg) => ({
    padding: "3px 10px",
    borderRadius: "20px",
    border: `1.5px solid ${isActive ? color : "#ddd"}`,
    background: isActive ? bg : "#fff",
    color: isActive ? color : "#aaa",
    fontSize: "11px",
    fontWeight: isActive ? 700 : 400,
    cursor: "pointer",
    transition: "all 0.15s",
    letterSpacing: "0.3px",
  }),
};

const URGENCY_BUTTONS = [
  { value: "apply_now", label: "Apply Now" },
  { value: "watch_space", label: "Watch" },
  { value: "informational", label: "Info" },
];

export default function OpportunityCard({ opportunity, onUrgencyChange }) {
  const [updating, setUpdating] = useState(false);
  const urgency = URGENCY_CONFIG[opportunity.urgency] || URGENCY_CONFIG.informational;
  const borderColor = urgency.color;

  const handleOverride = async (newUrgency) => {
    if (updating || newUrgency === opportunity.urgency || !onUrgencyChange) return;
    setUpdating(true);
    await onUrgencyChange(opportunity.id, newUrgency);
    setUpdating(false);
  };

  return (
    <div style={{ ...styles.card, borderLeftColor: borderColor }}>
      <div style={styles.header}>
        <div>
          <div style={styles.company}>
            {opportunity.company || "Unknown Company"}
          </div>
          {opportunity.role_hint && (
            <div style={styles.roleHint}>{opportunity.role_hint}</div>
          )}
        </div>
        <span style={styles.badge(urgency.color, urgency.bg)}>{urgency.label}</span>
      </div>

      <p style={styles.summary}>{opportunity.summary}</p>

      <div>
        <div style={styles.nextStepsLabel}>Next Steps</div>
        <div style={styles.nextSteps}>{opportunity.next_steps}</div>
      </div>

      <div style={styles.footer}>
        <div style={styles.scoreBar}>
          <span>Relevance</span>
          <div style={styles.barTrack}>
            <div style={styles.barFill(opportunity.relevance_score)} />
          </div>
          <span>{Math.round(opportunity.relevance_score * 100)}%</span>
        </div>
        {opportunity.news_source_url && (
          <a
            href={opportunity.news_source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.sourceLink}
          >
            View source
          </a>
        )}
        {!opportunity.news_source_url && opportunity.news_source_type && (
          <span style={{ fontSize: "12px", color: "#aaa" }}>
            {opportunity.news_source_type}
          </span>
        )}
      </div>

      {onUrgencyChange && (
        <div style={styles.overrideRow}>
          <span style={styles.overrideLabel}>Override:</span>
          {URGENCY_BUTTONS.map(({ value, label }) => {
            const cfg = URGENCY_CONFIG[value];
            const isActive = opportunity.urgency === value;
            return (
              <button
                key={value}
                style={styles.overrideBtn(isActive, cfg.color, cfg.bg)}
                onClick={() => handleOverride(value)}
                disabled={updating}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
