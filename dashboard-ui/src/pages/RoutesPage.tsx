import { RoutesTable } from "../components/RoutesTable";
import type { MetricsData } from "../hooks/useMetrics";
import { Route } from "lucide-react";

interface RoutesPageProps {
  data: MetricsData;
}

export function RoutesPage({ data }: RoutesPageProps) {
  return (
    <div className="page-content animate-in">
      <div className="panel-header" style={{ marginBottom: '1rem', justifyContent: 'flex-start', gap: '0.75rem' }}>
        <div className="brand-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
          <Route size={18} />
        </div>
        <div>
          <h2 style={{ fontSize: '1.25rem' }}>API Routes</h2>
          <p style={{ color: 'var(--text-400)', fontSize: '0.9rem' }}>Detailed breakdown of performance per endpoint.</p>
        </div>
      </div>
      <div className="panel">
        <RoutesTable routes={data.routes} />
      </div>
    </div>
  );
}
