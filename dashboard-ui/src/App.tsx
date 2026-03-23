import { AlertTriangle, Zap } from "lucide-react";
import { useMetrics } from "./hooks/useMetrics";
import { formatUptime } from "./utils/formatters";
import { KpiGrid } from "./components/KpiGrid";
import { RoutesTable } from "./components/RoutesTable";
import { HealthCharts } from "./components/HealthCharts";
import { CachePanel } from "./components/CachePanel";
import { LiveLogs } from "./components/LiveLogs";

export default function App() {
  const { data, history, error } = useMetrics();

  if (error) {
    return (
      <div
        className="dashboard-wrapper"
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div
          className="panel"
          style={{ padding: "3rem", textAlign: "center", maxWidth: "500px" }}
        >
          <AlertTriangle
            size={48}
            color="var(--accent-rose)"
            style={{ margin: "0 auto 1rem" }}
          />
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              marginBottom: "1rem",
              color: "var(--text-100)",
            }}
          >
            Connection Lost
          </h2>
          <p style={{ color: "var(--text-400)" }}>
            Unable to connect to the Performance API. Ensure your Express server
            is running and the toolkit is correctly configured.
          </p>
        </div>
      </div>
    );
  }

  if (!data)
    return (
      <div className="dashboard-wrapper empty-state">Connecting to API...</div>
    );

  return (
    <>
      <nav className="navbar animate-in">
        <div className="brand">
          <div className="brand-icon">
            <Zap size={18} />
          </div>
          <div className="brand-title">
            Express <span>Performance</span> Toolkit
          </div>
        </div>
        <div className="nav-actions">
          <div className="live-indicator">
            <div className="pulse-dot"></div> Live
            <span style={{ marginLeft: "8px", fontFamily: "var(--font-mono)" }}>
              {formatUptime(data.uptime)}
            </span>
          </div>
          <div className="live-indicator">
            <span>Lag</span>
            <span
              style={{
                marginLeft: "4px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color:
                  data.eventLoopLag > 100
                    ? "var(--accent-rose)"
                    : "var(--accent-emerald)",
              }}
            >
              {data.eventLoopLag}ms
            </span>
          </div>
          <div className="live-indicator">
            <span>RAM</span>
            <span
              style={{
                marginLeft: "4px",
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: "var(--text-100)",
              }}
            >
              {Math.round(data.memoryUsage.heapUsed / 1024 / 1024)}MB
            </span>
          </div>
        </div>
      </nav>

      <div className="dashboard-wrapper">
        <KpiGrid data={data} />

        <div className="middle-grid">
          <RoutesTable routes={data.routes} />

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <HealthCharts history={history} />
            <CachePanel data={data} />
          </div>
        </div>

        <LiveLogs logs={data.recentLogs} />
      </div>
    </>
  );
}
