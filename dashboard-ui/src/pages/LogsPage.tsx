import { LiveLogs } from "../components/LiveLogs";
import type { MetricsData } from "../hooks/useMetrics";
import { Terminal } from "lucide-react";

interface LogsPageProps {
  data: MetricsData;
}

export function LogsPage({ data }: LogsPageProps) {
  return (
    <div className="page-content animate-in" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header" style={{ marginBottom: '1rem', justifyContent: 'flex-start', gap: '0.75rem' }}>
        <div className="brand-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
          <Terminal size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>System Logs</h2>
          <p style={{ color: 'var(--text-400)', fontSize: '0.9rem' }}>Real-time request stream and performance events.</p>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <LiveLogs logs={data.recentLogs} />
      </div>
    </div>
  );
}
