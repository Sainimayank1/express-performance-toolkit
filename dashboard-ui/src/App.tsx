import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Zap,
  LogOut,
  LayoutDashboard,
  Route,
  Bell,
  Terminal,
} from "lucide-react";
import { useMetrics } from "./hooks/useMetrics";
import { formatUptime } from "./utils/formatters";
import { Login } from "./components/Login";

// Pages
import { OverviewPage } from "./pages/OverviewPage";
import { RoutesPage } from "./pages/RoutesPage";
import { InsightsPage } from "./pages/InsightsPage";
import { LogsPage } from "./pages/LogsPage";

type PageType = "overview" | "routes" | "insights" | "logs";

export default function App() {
  const [activePage, setActivePage] = useState<PageType>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [readInsightKeys, setReadInsightKeys] = useState<Set<string>>(new Set());

  const markInsightRead = (key: string) => {
    setReadInsightKeys((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  };

  const { data, history, error } = useMetrics(
    isAuthenticated === true || (isAuthenticated !== null && !isAuthRequired),
  );

  const checkAuth = async () => {
    try {
      const resp = await fetch("./api/auth-check");
      if (!resp.ok) throw new Error("Auth check failed");
      const authData = await resp.json();
      setIsAuthenticated(authData.authenticated);
      setIsAuthRequired(authData.required);
    } catch (err) {
      console.error("Auth check failed", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("./api/logout", { method: "POST" });
      setIsAuthenticated(false);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (String(error) === "Unauthorized" && isAuthenticated !== false) {
      checkAuth();
    }
  }, [error, isAuthenticated]);

  if (isAuthRequired && isAuthenticated === false) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  if (error && String(error) !== "Unauthorized") {
    return (
      <div className="dashboard-wrapper centered">
        <div className="panel error-state">
          <AlertTriangle size={48} color="var(--accent-rose)" />
          <h2>Connection Lost</h2>
          <p>
            Unable to connect to the Performance API. Ensure your Express server
            is running.
          </p>
        </div>
      </div>
    );
  }

  if (!data || isAuthenticated === null)
    return (
      <div className="dashboard-wrapper empty-state">Connecting to API...</div>
    );

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <OverviewPage data={data} history={history} />;
      case "routes":
        return <RoutesPage data={data} />;
      case "insights":
        return (
          <InsightsPage
            data={data}
            readKeys={readInsightKeys}
            onMarkRead={markInsightRead}
          />
        );
      case "logs":
        return <LogsPage data={data} />;
      default:
        return <OverviewPage data={data} history={history} />;
    }
  };

  return (
    <>
      <nav className="navbar animate-in">
        <div
          className="brand"
          onClick={() => setActivePage("overview")}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-icon">
            <Zap size={18} />
          </div>
          <div className="brand-title">
            Express <span>Performance</span> Toolkit
          </div>
        </div>

        <div className="nav-links">
          <button
            className={`nav-link ${activePage === "overview" ? "active" : ""}`}
            onClick={() => setActivePage("overview")}
          >
            <LayoutDashboard size={16} /> Overview
          </button>
          <button
            className={`nav-link ${activePage === "routes" ? "active" : ""}`}
            onClick={() => setActivePage("routes")}
          >
            <Route size={16} /> Routes
          </button>
          <button
            className={`nav-link ${activePage === "insights" ? "active" : ""}`}
            onClick={() => setActivePage("insights")}
          >
            <Bell size={16} /> Insights
            {data.insights.filter((i) => !readInsightKeys.has(i.key)).length > 0 && (
              <span className="badge">
                {data.insights.filter((i) => !readInsightKeys.has(i.key)).length}
              </span>
            )}
          </button>
          <button
            className={`nav-link ${activePage === "logs" ? "active" : ""}`}
            onClick={() => setActivePage("logs")}
          >
            <Terminal size={16} /> Logs
          </button>
        </div>

        <div className="nav-actions">
          <div className="live-indicator hide-mobile">
            <div className="pulse-dot"></div> Live
            <span className="uptime-mono">{formatUptime(data.uptime)}</span>
          </div>
          <div className="live-indicator">
            <span>Lag</span>
            <span
              className="lag-mono"
              style={{
                color:
                  data.eventLoopLag > 100
                    ? "var(--accent-rose)"
                    : "var(--accent-emerald)",
              }}
            >
              {data.eventLoopLag}ms
            </span>
          </div>
          {isAuthRequired && (
            <button
              className="nav-btn logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </nav>

      <div className="dashboard-wrapper">{renderPage()}</div>
    </>
  );
}
