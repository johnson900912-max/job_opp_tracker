import React, { useState, useEffect, useCallback } from "react";
import { dashboardApi, opportunitiesApi } from "../api/client.js";
import OpportunityCard from "../components/OpportunityCard.jsx";
import ReprocessingBanner from "../components/ReprocessingBanner.jsx";
import ExecSummary from "../components/ExecSummary.jsx";

const URGENCY_ORDER = { apply_now: 0, watch_space: 1, informational: 2 };

const styles = {
  container: { maxWidth: "860px", margin: "0 auto", padding: "32px 20px" },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "32px",
  },
  heading: { fontSize: "24px", fontWeight: 700, color: "#1a1a2e" },
  subtitle: { fontSize: "14px", color: "#666", marginTop: "4px" },
  refreshBtn: {
    padding: "8px 16px",
    borderRadius: "8px",
    border: "1.5px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    color: "#555",
    fontWeight: 500,
  },
  panel: {
    marginBottom: "32px",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    cursor: "pointer",
    userSelect: "none",
  },
  panelTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#1a1a2e",
    flex: 1,
  },
  panelBadge: {
    padding: "3px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 700,
    background: "#e94560",
    color: "#fff",
  },
  chevron: (open) => ({
    fontSize: "14px",
    color: "#aaa",
    transform: open ? "rotate(180deg)" : "none",
    transition: "transform 0.2s",
  }),
  empty: {
    padding: "24px",
    textAlign: "center",
    color: "#aaa",
    background: "#fafafa",
    borderRadius: "8px",
    fontSize: "14px",
  },
  emptyPage: {
    textAlign: "center",
    padding: "80px 20px",
    color: "#aaa",
  },
  emptyIcon: { fontSize: "48px", marginBottom: "16px" },
  emptyTitle: { fontSize: "18px", fontWeight: 600, color: "#888", marginBottom: "8px" },
  emptyText: { fontSize: "14px", lineHeight: "1.6" },
  filterBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  filterBtn: (active) => ({
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1.5px solid",
    borderColor: active ? "#1a1a2e" : "#ddd",
    background: active ? "#1a1a2e" : "#fff",
    color: active ? "#fff" : "#555",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
  }),
};

function PanelSection({ asp, opportunities, onUrgencyChange }) {
  const [open, setOpen] = useState(true);
  const count = opportunities.length;

  return (
    <div id={`panel-${asp.id}`} style={styles.panel}>
      <div style={styles.panelHeader} onClick={() => setOpen((o) => !o)}>
        <div style={styles.panelTitle}>{asp.title}</div>
        {count > 0 && <span style={styles.panelBadge}>{count}</span>}
        <span style={styles.chevron(open)}>▼</span>
      </div>
      {asp.description && (
        <div style={{ fontSize: "13px", color: "#888", marginBottom: "12px", marginTop: "-10px" }}>
          {asp.description}
        </div>
      )}
      {open && (
        <>
          {count === 0 ? (
            <div style={styles.empty}>No opportunities found for this goal yet.</div>
          ) : (
            opportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} onUrgencyChange={onUrgencyChange} />
            ))
          )}
        </>
      )}
    </div>
  );
}

export default function Dashboard({ refreshTrigger }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reprocessStatus, setReprocessStatus] = useState(null);
  const [urgencyFilter, setUrgencyFilter] = useState("all");

  const fetchDashboard = useCallback(async () => {
    try {
      const { data: d } = await dashboardApi.full();
      setData(d);
    } catch (e) {
      console.error("Dashboard fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUrgencyChange = useCallback(async (opportunityId, newUrgency) => {
    // Optimistic update — instant UI feedback in both ExecSummary and detail panels
    setData((prev) => ({
      ...prev,
      panels: prev.panels.map((panel) => ({
        ...panel,
        opportunities: panel.opportunities.map((opp) =>
          opp.id === opportunityId ? { ...opp, urgency: newUrgency } : opp
        ),
      })),
    }));
    try {
      await opportunitiesApi.updateUrgency(opportunityId, newUrgency);
    } catch (e) {
      console.error("Urgency update failed, reverting", e);
      fetchDashboard();
    }
  }, [fetchDashboard]);

  const fetchStatus = useCallback(async () => {
    try {
      const { data: s } = await dashboardApi.reprocessStatus();
      setReprocessStatus(s);
      return s;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchStatus();
  }, [fetchDashboard, fetchStatus, refreshTrigger]);

  // Poll reprocessing status
  useEffect(() => {
    let interval;
    const poll = async () => {
      const s = await fetchStatus();
      if (s && !s.is_running) {
        clearInterval(interval);
        fetchDashboard();
      }
    };

    if (reprocessStatus?.is_running) {
      interval = setInterval(poll, 3000);
    }

    return () => clearInterval(interval);
  }, [reprocessStatus?.is_running, fetchStatus, fetchDashboard]);

  if (loading) {
    return (
      <div style={{ ...styles.container, textAlign: "center", paddingTop: "80px" }}>
        <div style={{ color: "#aaa", fontSize: "14px" }}>Loading dashboard...</div>
      </div>
    );
  }

  if (!data || data.panels.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyPage}>
          <div style={styles.emptyIcon}>🎯</div>
          <div style={styles.emptyTitle}>No career goals yet</div>
          <div style={styles.emptyText}>
            Go to <strong>Career Goals</strong> to add the roles you're targeting,<br />
            then use <strong>Submit News</strong> to start finding opportunities.
          </div>
        </div>
      </div>
    );
  }

  // Count total opportunities
  const totalOpps = data.panels.reduce((sum, p) => sum + p.opportunities.length, 0);

  // Apply urgency filter
  const filteredPanels = data.panels.map((panel) => ({
    ...panel,
    opportunities:
      urgencyFilter === "all"
        ? panel.opportunities
        : panel.opportunities.filter((o) => o.urgency === urgencyFilter),
  }));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Opportunity Dashboard</h1>
          <div style={styles.subtitle}>
            {totalOpps} total opportunit{totalOpps !== 1 ? "ies" : "y"} across {data.panels.length} career goal{data.panels.length !== 1 ? "s" : ""}
          </div>
        </div>
        <button style={styles.refreshBtn} onClick={fetchDashboard}>Refresh</button>
      </div>

      <ReprocessingBanner status={reprocessStatus} />

      <ExecSummary panels={data.panels} onUrgencyChange={handleUrgencyChange} />

      <div style={{ borderBottom: "1px solid #eee", marginBottom: "28px" }} />

      <div style={styles.filterBar}>
        {["all", "apply_now", "watch_space", "informational"].map((f) => (
          <button key={f} style={styles.filterBtn(urgencyFilter === f)} onClick={() => setUrgencyFilter(f)}>
            {f === "all" ? "All" : f === "apply_now" ? "Apply Now" : f === "watch_space" ? "Watch Space" : "Informational"}
          </button>
        ))}
      </div>

      {filteredPanels.map(({ aspiration, opportunities }) => (
        <PanelSection
          key={aspiration.id}
          asp={aspiration}
          opportunities={opportunities}
          onUrgencyChange={handleUrgencyChange}
        />
      ))}
    </div>
  );
}
