import type { Insight } from "../hooks/useMetrics";
import { Lightbulb, AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";

export function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (!insights || insights.length === 0) {
    return (
      <div className="panel animate-in delay-3" style={{ marginTop: '20px' }}>
        <div className="panel-header">
          <div className="panel-title">✨ Smart Recommendations</div>
        </div>
        <div className="panel-body" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-400)' }}>
            <Lightbulb size={24} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No performance issues detected. Everything looks optimal!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel animate-in delay-3" style={{ marginTop: '20px' }}>
      <div className="panel-header">
        <div className="panel-title">✨ Smart Recommendations ({insights.length})</div>
      </div>
      <div className="panel-body" style={{ padding: '0px' }}>
        <div className="insights-list">
          {insights.map((insight, idx) => (
            <div key={idx} className={`insight-item type-${insight.type}`}>
               <div className="insight-icon">
                  {insight.type === 'error' && <AlertCircle size={18} className="val-rose" />}
                  {insight.type === 'warning' && <AlertTriangle size={18} className="val-amber" />}
                  {insight.type === 'info' && <Info size={18} className="val-emerald" />}
               </div>
               <div className="insight-content">
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-message">{insight.message}</div>
                  {insight.action && (
                    <div className="insight-action">
                       <ArrowRight size={12} style={{ marginRight: 6 }} />
                       {insight.action}
                    </div>
                  )}
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
