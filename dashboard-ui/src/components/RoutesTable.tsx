import type { RouteStats } from "../hooks/useMetrics";
import { fNum, getTimeClass, fBytes } from "../utils/formatters";

export function RoutesTable({
  routes,
}: {
  routes: Record<string, RouteStats>;
}) {
  const routeEntries = Object.entries(routes)
    .sort(([, a], [, b]) => b.avgTime - a.avgTime)
    .slice(0, 8); // top 8 slowest

  return (
    <div className="panel animate-in delay-2" style={{ maxHeight: "500px" }}>
      <div className="panel-header">
        <div className="panel-title">📉 Route Performance</div>
      </div>
      <div className="panel-body" style={{ padding: 0 }}>
        <div className="table-container">
          <table className="routes-table">
            <thead>
              <tr>
                <th>Route Path</th>
                <th>Calls</th>
                <th>Avg Latency</th>
                <th>Payload</th>
                <th>Anomalies</th>
              </tr>
            </thead>
            <tbody>
              {routeEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No route data collected yet.
                  </td>
                </tr>
              ) : (
                routeEntries.map(([route, stats]) => {
                  const anomalies = [];
                  if (stats.slowCount > 0)
                    anomalies.push(
                      <span key="slow">
                        <span style={{ color: "var(--accent-rose)" }}>
                          {stats.slowCount} Slow
                        </span>
                      </span>,
                    );
                  if (stats.highQueryCount > 0)
                    anomalies.push(
                      <span key="n1">
                        <span style={{ color: "var(--accent-amber)" }}>⚠️</span>{" "}
                        <span style={{ color: "var(--accent-amber)" }}>
                          {stats.highQueryCount} N+1
                        </span>
                      </span>,
                    );

                  return (
                    <tr key={route}>
                      <td className="route-path">{route}</td>
                      <td style={{ color: "var(--text-300)" }}>
                        {fNum(stats.count)}
                      </td>
                      <td className={getTimeClass(stats.avgTime)}>
                        {stats.avgTime}ms
                      </td>
                      <td style={{ color: "var(--text-300)" }}>
                        {fBytes(stats.avgSize)}
                      </td>
                      <td>
                        {anomalies.length > 0 ? (
                          <div
                            style={{
                              display: "flex",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >
                            {anomalies.map((a, i) => (
                              <span key={i}>
                                {i > 0 && (
                                  <span
                                    style={{
                                      color: "var(--border)",
                                      margin: "0 4px",
                                    }}
                                  >
                                    |
                                  </span>
                                )}
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--text-400)" }}>-</span>
                        )}
                      </td>
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
