import { Activity } from "lucide-react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export type ChartDataPoint = {
  time: string;
  lag: number;
  memory: number;
};

export function HealthCharts({ history }: { history: ChartDataPoint[] }) {
  return (
    <div
      className="panel animate-in delay-3"
      style={{ flex: 1, minHeight: "260px" }}
    >
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={18} /> Server Health (Live)
        </div>
      </div>
      <div
        className="panel-body"
        style={{
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <div style={{ height: "90px", width: "100%" }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-400)",
              marginBottom: "4px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Event Loop Lag (ms)</span>
            <span style={{ color: "var(--accent-cyan)" }}>
              Latest: {history[history.length - 1]?.lag || 0}ms
            </span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="lagColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--accent-cyan)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--accent-cyan)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface-glass)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
                itemStyle={{ color: "var(--text-100)" }}
              />
              <Area
                type="monotone"
                dataKey="lag"
                stroke="var(--accent-cyan)"
                fillOpacity={1}
                fill="url(#lagColor)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={{ height: "90px", width: "100%" }}>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-400)",
              marginBottom: "4px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Heap Memory Used (MB)</span>
            <span style={{ color: "var(--accent-indigo)" }}>
              Latest: {history[history.length - 1]?.memory || 0}MB
            </span>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={history}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="memColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--accent-indigo)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--accent-indigo)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{
                  background: "var(--bg-surface-glass)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "0.8rem",
                }}
                itemStyle={{ color: "var(--text-100)" }}
              />
              <Area
                type="monotone"
                dataKey="memory"
                stroke="var(--accent-indigo)"
                fillOpacity={1}
                fill="url(#memColor)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
