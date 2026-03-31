import { useState } from "react";
import type { LogEntry } from "../hooks/useMetrics";
import { fTime, getStatusClass, getTimeClass } from "../utils/formatters";
import { Download } from "lucide-react";
import { downloadCSV } from "../utils/exportUtils";

export function LiveLogs({ logs }: { logs: LogEntry[] }) {
  const [filter, setFilter] = useState<"all" | "slow" | "cached" | "errors">(
    "all",
  );
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  let filtered = logs;
  if (filter === "slow") filtered = logs.filter((l) => l.slow);
  else if (filter === "cached") filtered = logs.filter((l) => l.cached);
  else if (filter === "errors")
    filtered = logs.filter((l) => l.statusCode >= 400);

  if (methodFilter !== "ALL") {
    filtered = filtered.filter((l) => l.method === methodFilter);
  }

  if (search) {
    const terms = search.toLowerCase().split(" ").filter(Boolean);
    filtered = filtered.filter((l) => {
      const logStr = `${l.method} ${l.path} ${l.requestId} ${l.statusCode}`.toLowerCase();
      return terms.every((term) => logStr.includes(term));
    });
  }

  const handleExportCSV = () => {
    downloadCSV(filtered, `ept-logs-${new Date().getTime()}`);
  };

  const methods = ["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"];

  return (
    <div className="panel animate-in delay-5">
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div className="panel-title">📋 Live Request Stream</div>
        
        <div className="filters">
          <select 
            value={methodFilter} 
            onChange={(e) => setMethodFilter((e.target as HTMLSelectElement).value)}
            className="filter-select"
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              background: "var(--bg-200)",
              color: "var(--text-100)",
              fontSize: "12px",
              marginRight: "8px"
            }}
          >
            {methods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

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

        <div className="search-box">
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            style={{
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid var(--border)",
              background: "var(--bg-200)",
              color: "var(--text-100)",
              fontSize: "12px",
              width: "180px",
            }}
          />
        </div>

        <button 
          onClick={handleExportCSV}
          className="nav-btn"
          title="Export as CSV"
          style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      <div className="panel-body" style={{ padding: 0, maxHeight: "500px" }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Method</th>
                <th style={{ width: "30%" }}>Path</th>
                <th>Request ID</th>
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
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "11px",
                            color: "var(--text-400)",
                          }}
                        >
                          {log.requestId || "-"}
                        </td>
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
