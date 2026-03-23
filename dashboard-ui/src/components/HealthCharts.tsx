import { Activity } from "lucide-react";
import { Sparkline } from "./Sparkline";

export type ChartDataPoint = {
  time: string;
  lag: number;
  memory: number;
};

export function HealthCharts({ history }: { history: ChartDataPoint[] }) {
  const lagData = history.map((d) => d.lag);
  const memData = history.map((d) => d.memory);

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
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        <div style={{ flex: 1, width: "100%" }}>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-400)",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>Event Loop Lag (ms)</span>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600, fontSize: '1rem' }}>
              {history[history.length - 1]?.lag || 0}ms
            </span>
          </div>
          <div style={{ height: "60px" }}>
            <Sparkline 
              data={lagData} 
              color="var(--accent-cyan)" 
              gradientId="lagGrad" 
            />
          </div>
        </div>

        <div style={{ flex: 1, width: "100%" }}>
          <div
            style={{
              fontSize: "0.85rem",
              color: "var(--text-400)",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <span>Heap Memory Used (MB)</span>
            <span style={{ color: "var(--accent-indigo)", fontWeight: 600, fontSize: '1rem' }}>
              {history[history.length - 1]?.memory || 0}MB
            </span>
          </div>
          <div style={{ height: "60px" }}>
            <Sparkline 
              data={memData} 
              color="var(--accent-indigo)" 
              gradientId="memGrad" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
