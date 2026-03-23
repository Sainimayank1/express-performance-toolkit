import { KpiGrid } from "../components/KpiGrid";
import { HealthCharts } from "../components/HealthCharts";
import { CachePanel } from "../components/CachePanel";
import type { MetricsData, HistoryData } from "../hooks/useMetrics";
import { Zap } from "lucide-react";

interface OverviewPageProps {
  data: MetricsData;
  history: HistoryData[];
}

export function OverviewPage({ data, history }: OverviewPageProps) {
  return (
    <div className="page-content animate-in">
      <div className="panel-header" style={{ marginBottom: '1rem', justifyContent: 'flex-start', gap: '0.75rem' }}>
        <div className="brand-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
          <Zap size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>System Overview</h2>
          <p style={{ color: 'var(--text-400)', fontSize: '0.9rem' }}>Real-time performance metrics and system health.</p>
        </div>
      </div>
      <KpiGrid data={data} />
      
      <div className="middle-grid">
        <HealthCharts history={history} />
        <CachePanel data={data} />
      </div>
    </div>
  );
}
