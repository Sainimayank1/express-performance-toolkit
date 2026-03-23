import { useState } from "react";
import type { LogEntry } from "../hooks/useMetrics";
import { fTime, getStatusClass, getTimeClass } from "../utils/formatters";

export function LiveLogs({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<"all" | "slow" | "cached" | "errors">(
    "all",
  );

  let filtered = logs;
  if (filter === "slow") filtered = logs.filter((l) => l.slow);
  else if (filter === "cached") filtered = logs.filter((l) => l.cached);
  else if (filter === "errors")
    filtered = logs.filter((l) => l.statusCode >= 400);

  return (
    <div className="panel animate-in delay-5">
      <div className="panel-header">
        <div className="panel-title">📋 Live Request Stream</div>
        <div className="filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === "slow" ? "active" : ""}`}
            onClick={() => setFilter("slow")}
          >
            Slow
          </button>
          <button
            className={`filter-btn ${filter === "cached" ? "active" : ""}`}
            onClick={() => setFilter("cached")}
          >
            Cached
          </button>
          <button
            className={`filter-btn ${filter === "errors" ? "active" : ""}`}
            onClick={() => setFilter("errors")}
          >
            Errors
          </button>
        </div>
      </div>
      <div className="panel-body" style={{ padding: 0, maxHeight: "500px" }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th style={{ width: "40%" }}>Path</th>
                <th>Status</th>
                <th>LATENCY</th>
                <th>Cache</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <div className="empty-icon">✨</div>
                    <p>No matching requests found</p>
                  </td>
                </tr>
              ) : (
                filtered
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((log, i) => {
                    const flag = log.slow ? (
                      <span className="fire-icon" title="Slow Request">
                        ⚠️
                      </span>
                    ) : log.highQueries ? (
                      <span
                        style={{ color: "var(--accent-amber)" }}
                        title="High DB Queries"
                      >
                        ⚠️
                      </span>
                    ) : (
                      "-"
                    );

                    return (
                      <tr
                        key={i}
                        style={
                          log.slow ? { background: "rgba(244,63,94,0.03)" } : {}
                        }
                      >
                        <td
                          style={{
                            color: "var(--text-300)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {fTime(log.timestamp)}
                        </td>
                        <td>
                          <span className={`badge badge-${log.method}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="route-path">{log.path}</td>
                        <td
                          className={`status-code ${getStatusClass(log.statusCode)}`}
                          style={{ textAlign: "left" }}
                        >
                          {log.statusCode}
                        </td>
                        <td
                          className={getTimeClass(log.responseTime)}
                          style={{ fontWeight: 600 }}
                        >
                          {log.responseTime}ms
                        </td>
                        <td>
                          {log.cached ? (
                            <span className="badge cache-hit">HIT</span>
                          ) : (
                            <span className="badge cache-miss">MISS</span>
                          )}
                        </td>
                        <td>{flag}</td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
