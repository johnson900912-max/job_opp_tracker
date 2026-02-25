import React from "react";

const styles = {
  nav: {
    background: "#1a1a2e",
    color: "#fff",
    padding: "0 24px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  logo: {
    fontSize: "18px",
    fontWeight: 700,
    letterSpacing: "-0.3px",
  },
  tabs: {
    display: "flex",
    gap: "4px",
  },
  tab: (active) => ({
    padding: "6px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    background: active ? "#e94560" : "transparent",
    color: active ? "#fff" : "rgba(255,255,255,0.7)",
    transition: "all 0.15s",
  }),
};

export default function Navbar({ activeTab, onTabChange }) {
  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>Job Opportunity Tracker</div>
      <div style={styles.tabs}>
        {["dashboard", "submit", "aspirations"].map((tab) => (
          <button
            key={tab}
            style={styles.tab(activeTab === tab)}
            onClick={() => onTabChange(tab)}
          >
            {tab === "dashboard" && "Dashboard"}
            {tab === "submit" && "Submit News"}
            {tab === "aspirations" && "Career Goals"}
          </button>
        ))}
      </div>
    </nav>
  );
}
