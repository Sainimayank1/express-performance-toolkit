import type { MetricsData } from "../hooks/useMetrics";
import { fNum } from "../utils/formatters";

export function CachePanel({ data }: { data: MetricsData }) {
  const hitPct = data.cacheHitRate;
  return (
    <div className="panel animate-in delay-4" style={{ flex: 1 }}>
      <div className="panel-header">
        <div className="panel-title">Cache Engine</div>
      </div>
      <div className="panel-body">
        <div className="cache-viz">
          <div className="donut-wrap">
            <svg
              viewBox="0 0 42 42"
              width="140"
              height="140"
              style={{ transform: "rotate(-90deg)" }}
            >
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke="var(--gauge-bg)"
                strokeWidth="6"
              />
              <circle
                cx="21"
                cy="21"
                r="15.915"
                fill="none"
                stroke="url(#gradHit)"
                strokeWidth="6"
                strokeDasharray={`${hitPct} ${100 - hitPct}`}
                strokeLinecap="round"
                style={{
                  transition:
                    "stroke-dasharray 1s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
              <defs>
                <linearGradient id="gradHit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" />
                  <stop offset="100%" stopColor="var(--accent-emerald)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="donut-center" style={{ transform: "scale(0.9)" }}>
              <div className="donut-val">{hitPct}%</div>
              <div className="donut-lbl">Hits</div>
            </div>
          </div>
          <div className="legend">
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{ background: "var(--grad-success)" }}
              ></div>
              <span>Hits</span>
              <span className="legend-val">{fNum(data.cacheHits)}</span>
            </div>
            <div className="legend-item">
              <div
                className="legend-dot"
                style={{
                  background: "var(--gauge-bg)",
                  border: "1px solid var(--border)",
                }}
              ></div>
              <span>Misses</span>
              <span className="legend-val">{fNum(data.cacheMisses)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
