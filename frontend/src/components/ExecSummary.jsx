import React, { useMemo, useState } from "react";

const URGENCY_CONFIG = {
  apply_now: { label: "Apply Now", color: "#c0392b", bg: "#fde8e7" },
  watch_space: { label: "Watch Space", color: "#d68910", bg: "#fef9e7" },
  informational: { label: "Informational", color: "#2471a3", bg: "#ebf5fb" },
};

const URGENCY_BUTTONS = [
  { value: "apply_now", label: "Apply Now" },
  { value: "watch_space", label: "Watch" },
  { value: "informational", label: "Info" },
];

// ── Internal: compact priority card ─────────────────────────────────────────

function PriorityCard({ opp, onUrgencyChange }) {
  const [updating, setUpdating] = useState(false);
  const cfg = URGENCY_CONFIG[opp.urgency] || URGENCY_CONFIG.informational;

  const handleOverride = async (newUrgency) => {
    if (updating || newUrgency === opp.urgency || !onUrgencyChange) return;
    setUpdating(true);
    await onUrgencyChange(opp.id, newUrgency);
    setUpdating(false);
  };

  return (
    <div style={s.priorityCard}>
      <div style={s.priorityCardTop}>
        <div style={s.priorityLeft}>
          <span style={s.badge(cfg.color, cfg.bg)}>{cfg.label}</span>
          <span style={s.priorityCompany}>{opp.company || "Unknown Company"}</span>
          {opp.role_hint && <span style={s.priorityRole}> · {opp.role_hint}</span>}
        </div>
        <div style={s.priorityRight}>
          <span style={s.aspirationTag}>{opp.aspirationTitle}</span>
          <span style={s.scoreChip}>{Math.round(opp.relevance_score * 100)}%</span>
        </div>
      </div>

      <p style={s.prioritySummary}>{opp.summary}</p>

      <div style={s.overrideRow}>
        <span style={s.overrideLabel}>Override:</span>
        {URGENCY_BUTTONS.map(({ value, label }) => {
          const btnCfg = URGENCY_CONFIG[value];
          const isActive = opp.urgency === value;
          return (
            <button
              key={value}
              style={s.overrideBtn(isActive, btnCfg.color, btnCfg.bg)}
              onClick={() => handleOverride(value)}
              disabled={updating}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ExecSummary component ───────────────────────────────────────────────

export default function ExecSummary({ panels, onUrgencyChange }) {
  const [priorityOpen, setPriorityOpen] = useState(true);
  const [goalsOpen, setGoalsOpen] = useState(true);

  const allOpportunities = useMemo(
    () =>
      panels.flatMap((p) =>
        p.opportunities.map((o) => ({ ...o, aspirationTitle: p.aspiration.title, aspirationId: p.aspiration.id }))
      ),
    [panels]
  );

  const kpis = useMemo(() => {
    const total = allOpportunities.length;
    const applyNow = allOpportunities.filter((o) => o.urgency === "apply_now").length;
    const watchSpace = allOpportunities.filter((o) => o.urgency === "watch_space").length;
    const avgScore =
      total > 0 ? allOpportunities.reduce((sum, o) => sum + o.relevance_score, 0) / total : 0;
    return { total, applyNow, watchSpace, avgScore };
  }, [allOpportunities]);

  const priorityItems = useMemo(
    () =>
      allOpportunities
        .filter((o) => o.urgency === "apply_now" || o.urgency === "watch_space")
        .sort((a, b) => {
          const order = { apply_now: 0, watch_space: 1 };
          if (order[a.urgency] !== order[b.urgency]) return order[a.urgency] - order[b.urgency];
          return b.relevance_score - a.relevance_score;
        }),
    [allOpportunities]
  );

  const goalStats = useMemo(
    () =>
      panels.map((p) => {
        const opps = p.opportunities;
        const total = opps.length;
        const applyNow = opps.filter((o) => o.urgency === "apply_now").length;
        const watchSpace = opps.filter((o) => o.urgency === "watch_space").length;
        const avgScore =
          total > 0 ? opps.reduce((sum, o) => sum + o.relevance_score, 0) / total : 0;
        return { ...p.aspiration, total, applyNow, watchSpace, avgScore };
      }),
    [panels]
  );

  const scrollToPanel = (aspirationId) => {
    document.getElementById(`panel-${aspirationId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={s.container}>
      {/* ── KPI Bar ── */}
      <div style={s.kpiBar}>
        <KpiTile label="Total Opportunities" value={kpis.total} accent={false} />
        <KpiTile
          label="Apply Now"
          value={kpis.applyNow}
          accent={kpis.applyNow > 0}
          accentColor="#c0392b"
        />
        <KpiTile
          label="Watch Space"
          value={kpis.watchSpace}
          accent={kpis.watchSpace > 0}
          accentColor="#d68910"
        />
        <KpiTile label="Avg Relevance" value={`${Math.round(kpis.avgScore * 100)}%`} accent={false} />
      </div>

      {/* ── Priority Section ── */}
      <div style={s.section}>
        <div style={s.sectionHeader} onClick={() => setPriorityOpen((o) => !o)}>
          <div style={s.sectionTitle}>
            Action Required
            {priorityItems.length > 0 && (
              <span style={s.countBadge(priorityItems.length > 0 ? "#c0392b" : "#aaa")}>
                {priorityItems.length}
              </span>
            )}
          </div>
          <span style={s.chevron(priorityOpen)}>▼</span>
        </div>

        {priorityOpen && (
          <>
            {priorityItems.length === 0 ? (
              <div style={s.emptyState}>
                No "Apply Now" or "Watch Space" items — all opportunities are informational.
              </div>
            ) : (
              priorityItems.map((opp) => (
                <PriorityCard key={opp.id} opp={opp} onUrgencyChange={onUrgencyChange} />
              ))
            )}
          </>
        )}
      </div>

      {/* ── Goals at a Glance ── */}
      <div style={s.section}>
        <div style={s.sectionHeader} onClick={() => setGoalsOpen((o) => !o)}>
          <div style={s.sectionTitle}>Goals at a Glance</div>
          <span style={s.chevron(goalsOpen)}>▼</span>
        </div>

        {goalsOpen && (
          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["Career Goal", "Total", "Apply Now", "Watch Space", "Avg Score"].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {goalStats.map((g, i) => (
                  <tr
                    key={g.id}
                    style={{ ...s.tr, background: i % 2 === 0 ? "#fff" : "#fafafa" }}
                    onClick={() => scrollToPanel(g.id)}
                  >
                    <td style={{ ...s.td, fontWeight: 600, color: "#1a1a2e" }}>{g.title}</td>
                    <td style={s.td}>{g.total}</td>
                    <td style={{ ...s.td, color: g.applyNow > 0 ? "#c0392b" : "#555", fontWeight: g.applyNow > 0 ? 700 : 400 }}>
                      {g.applyNow}
                    </td>
                    <td style={{ ...s.td, color: g.watchSpace > 0 ? "#d68910" : "#555", fontWeight: g.watchSpace > 0 ? 700 : 400 }}>
                      {g.watchSpace}
                    </td>
                    <td style={s.td}>{Math.round(g.avgScore * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={s.tableHint}>Click a row to scroll to that goal's detail panel</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── KPI Tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, accent, accentColor }) {
  return (
    <div style={s.kpiTile(accent, accentColor)}>
      <div style={s.kpiValue(accent, accentColor)}>{value}</div>
      <div style={s.kpiLabel}>{label}</div>
    </div>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = {
  container: {
    marginBottom: "8px",
  },
  kpiBar: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "24px",
  },
  kpiTile: (accent, color) => ({
    background: "#fff",
    borderRadius: "10px",
    padding: "16px 20px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
    borderLeft: accent ? `4px solid ${color}` : "4px solid transparent",
    minWidth: 0,
  }),
  kpiValue: (accent, color) => ({
    fontSize: "28px",
    fontWeight: 800,
    color: accent ? color : "#1a1a2e",
    lineHeight: 1,
    marginBottom: "4px",
  }),
  kpiLabel: {
    fontSize: "12px",
    color: "#888",
    fontWeight: 500,
  },
  section: {
    marginBottom: "20px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    userSelect: "none",
    marginBottom: "12px",
    padding: "2px 0",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1a1a2e",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  countBadge: (color) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "22px",
    height: "22px",
    borderRadius: "11px",
    background: color,
    color: "#fff",
    fontSize: "12px",
    fontWeight: 700,
    padding: "0 6px",
  }),
  chevron: (open) => ({
    fontSize: "12px",
    color: "#aaa",
    transform: open ? "rotate(180deg)" : "none",
    transition: "transform 0.2s",
  }),
  emptyState: {
    padding: "16px 20px",
    background: "#fafafa",
    borderRadius: "8px",
    fontSize: "14px",
    color: "#aaa",
    textAlign: "center",
  },
  priorityCard: {
    background: "#fff",
    borderRadius: "8px",
    padding: "14px 16px",
    marginBottom: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
  },
  priorityCardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "8px",
    flexWrap: "wrap",
  },
  priorityLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  priorityRight: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexShrink: 0,
  },
  priorityCompany: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#1a1a2e",
  },
  priorityRole: {
    fontSize: "13px",
    color: "#666",
  },
  aspirationTag: {
    padding: "2px 8px",
    borderRadius: "4px",
    background: "#f0f0f0",
    fontSize: "11px",
    color: "#555",
    fontWeight: 500,
  },
  scoreChip: {
    fontSize: "12px",
    color: "#888",
    fontWeight: 600,
  },
  prioritySummary: {
    fontSize: "13px",
    color: "#444",
    lineHeight: "1.5",
    margin: "0 0 10px 0",
  },
  overrideRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    paddingTop: "8px",
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
  }),
  badge: (color, bg) => ({
    padding: "2px 8px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: 700,
    color,
    background: bg,
    whiteSpace: "nowrap",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
  }),
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 700,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "2px solid #eee",
  },
  tr: {
    cursor: "pointer",
  },
  td: {
    padding: "10px 12px",
    color: "#555",
    borderBottom: "1px solid #f0f0f0",
  },
  tableHint: {
    fontSize: "11px",
    color: "#bbb",
    textAlign: "right",
    marginTop: "6px",
  },
};
