import { InsightsPanel } from "../components/InsightsPanel";
import type { MetricsData } from "../hooks/useMetrics";
import { Bell } from "lucide-react";

interface InsightsPageProps {
  data: MetricsData;
  readKeys: Set<string>;
  onMarkRead: (key: string) => void;
}

export function InsightsPage({ data, readKeys, onMarkRead }: InsightsPageProps) {
  return (
    <div className="page-content animate-in">
      <div
        className="panel-header"
        style={{
          marginBottom: "1rem",
          justifyContent: "flex-start",
          gap: "0.75rem",
        }}
      >
        <div
          className="brand-icon"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Bell size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: "1.25rem" }}>Performance Insights</h2>
          <p style={{ color: "var(--text-400)", fontSize: "0.9rem" }}>
            AI-generated recommendations and health alerts. Tap an insight for details.
          </p>
        </div>
      </div>
      <InsightsPanel
        insights={data.insights}
        readKeys={readKeys}
        onMarkRead={onMarkRead}
      />
    </div>
  );
}
