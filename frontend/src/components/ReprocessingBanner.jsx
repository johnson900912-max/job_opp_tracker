import React from "react";

const styles = {
  banner: {
    background: "#fff3cd",
    border: "1px solid #ffc107",
    borderRadius: "8px",
    padding: "12px 20px",
    marginBottom: "20px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontSize: "14px",
    color: "#856404",
  },
  spinner: {
    width: "16px",
    height: "16px",
    border: "2px solid #ffc107",
    borderTop: "2px solid #856404",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    flexShrink: 0,
  },
  progress: {
    marginLeft: "auto",
    fontSize: "13px",
    fontWeight: 600,
  },
};

// Inject keyframe animation once
if (typeof document !== "undefined" && !document.getElementById("spinner-style")) {
  const style = document.createElement("style");
  style.id = "spinner-style";
  style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(style);
}

export default function ReprocessingBanner({ status }) {
  if (!status || !status.is_running) return null;

  const pct =
    status.total_items > 0
      ? Math.round((status.completed_items / status.total_items) * 100)
      : 0;

  return (
    <div style={styles.banner}>
      <div style={styles.spinner} />
      <span>
        Re-analyzing past news with your updated career goals...
      </span>
      {status.total_items > 0 && (
        <span style={styles.progress}>
          {status.completed_items} / {status.total_items} ({pct}%)
        </span>
      )}
    </div>
  );
}
