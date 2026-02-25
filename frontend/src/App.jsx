import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import SubmitNews from "./pages/SubmitNews.jsx";
import Aspirations from "./pages/Aspirations.jsx";

// Inject global spinner animation
const style = document.createElement("style");
style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
document.head.appendChild(style);

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [dashRefreshKey, setDashRefreshKey] = useState(0);

  const handleNewOpportunities = () => {
    setDashRefreshKey((k) => k + 1);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      <main>
        {activeTab === "dashboard" && (
          <Dashboard refreshTrigger={dashRefreshKey} />
        )}
        {activeTab === "submit" && (
          <SubmitNews onNewOpportunities={handleNewOpportunities} />
        )}
        {activeTab === "aspirations" && (
          <Aspirations />
        )}
      </main>
    </div>
  );
}
