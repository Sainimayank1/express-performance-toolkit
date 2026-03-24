import { useState } from "react";
import { createPortal } from "react-dom";
import type { Insight } from "../hooks/useMetrics";
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  X,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

interface InsightsPanelProps {
  insights: Insight[];
  readKeys: Set<string>;
  onMarkRead: (key: string) => void;
}

function InsightDetailModal({
  insight,
  onClose,
}: {
  insight: Insight;
  onClose: () => void;
}) {
  const typeConfig = {
    error: {
      color: "var(--accent-rose)",
      bg: "rgba(244,63,94,0.08)",
      border: "rgba(244,63,94,0.2)",
      label: "Critical",
      Icon: AlertCircle,
    },
    warning: {
      color: "var(--accent-amber)",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.2)",
      label: "Warning",
      Icon: AlertTriangle,
    },
    info: {
      color: "var(--accent-emerald)",
      bg: "rgba(52,211,153,0.08)",
      border: "rgba(52,211,153,0.2)",
      label: "Info",
      Icon: Info,
    },
  };

  const config = typeConfig[insight.type];

  // Simple markdown-like rendering for detail text
  const renderDetail = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) {
        return (
          <h4
            key={i}
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "var(--text-100)",
              marginTop: "1rem",
              marginBottom: "0.5rem",
            }}
          >
            {line.slice(4)}
          </h4>
        );
      }
      if (line.startsWith("- **")) {
        const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
        if (match) {
          return (
            <div
              key={i}
              style={{
                padding: "4px 0",
                paddingLeft: "12px",
                fontSize: "0.8rem",
                color: "var(--text-300)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: "var(--text-100)", fontWeight: 600 }}>
                • {match[1]}:
              </span>{" "}
              {match[2]}
            </div>
          );
        }
      }
      if (line.match(/^\d+\. \*\*/)) {
        const match = line.match(/^(\d+)\. \*\*(.+?)\*\*:?\s*(.*)/);
        if (match) {
          return (
            <div
              key={i}
              style={{
                padding: "4px 0",
                paddingLeft: "12px",
                fontSize: "0.8rem",
                color: "var(--text-300)",
                lineHeight: 1.5,
              }}
            >
              <span style={{ color: config.color, fontWeight: 700 }}>
                {match[1]}.
              </span>{" "}
              <span style={{ color: "var(--text-100)", fontWeight: 600 }}>
                {match[2]}:
              </span>{" "}
              {match[3]}
            </div>
          );
        }
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <div
            key={i}
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--text-200)",
              padding: "2px 0",
            }}
          >
            {line.replace(/\*\*/g, "")}
          </div>
        );
      }
      if (line.match(/^\*\*(.+?)\*\*\s*(.*)/)) {
        const match = line.match(/^\*\*(.+?)\*\*\s*(.*)/);
        if (match) {
          return (
            <div
              key={i}
              style={{
                fontSize: "0.8rem",
                color: "var(--text-300)",
                padding: "2px 0",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--text-200)" }}>
                {match[1]}
              </span>{" "}
              {match[2]}
            </div>
          );
        }
      }
      if (line === "") return <div key={i} style={{ height: "4px" }} />;
      return (
        <div
          key={i}
          style={{
            fontSize: "0.8rem",
            color: "var(--text-300)",
            lineHeight: 1.6,
            padding: "2px 0",
          }}
        >
          {line}
        </div>
      );
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content animate-in">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "1.5rem",
            borderBottom: `1px solid ${config.border}`,
            background: config.bg,
          }}
        >
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: config.bg,
                border: `1px solid ${config.border}`,
                display: "grid",
                placeItems: "center",
              }}
            >
              <config.Icon size={20} style={{ color: config.color }} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: config.color,
                    background: `${config.color}18`,
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {config.label}
                </span>
              </div>
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "var(--text-100)",
                }}
              >
                {insight.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              color: "var(--text-400)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "1.5rem",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          {/* Summary */}
          <div
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "10px",
              padding: "1rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--text-200)",
                lineHeight: 1.6,
              }}
            >
              {insight.message}
            </div>
            {insight.action && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "8px",
                  fontSize: "0.8rem",
                  color: config.color,
                  fontWeight: 600,
                }}
              >
                <ArrowRight size={14} />
                {insight.action}
              </div>
            )}
          </div>

          {/* Detailed Analysis */}
          {insight.detail && (
            <div>{renderDetail(insight.detail)}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InsightsPanel({
  insights,
  readKeys,
  onMarkRead,
}: InsightsPanelProps) {
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

  const handleInsightClick = (insight: Insight) => {
    onMarkRead(insight.key);
    setSelectedInsight(insight);
  };

  if (!insights || insights.length === 0) {
    return (
      <div className="panel animate-in delay-3" style={{ marginTop: "20px" }}>
        <div className="panel-header">
          <div className="panel-title">✨ Smart Recommendations</div>
        </div>
        <div
          className="panel-body"
          style={{
            textAlign: "center",
            padding: "40px",
            color: "var(--text-400)",
          }}
        >
          <CheckCircle2
            size={32}
            style={{
              marginBottom: "12px",
              opacity: 0.5,
              color: "var(--accent-emerald)",
            }}
          />
          <p>No performance issues detected. Everything looks optimal!</p>
        </div>
      </div>
    );
  }

  const unreadCount = insights.filter((i) => !readKeys.has(i.key)).length;

  return (
    <>
      <div className="panel animate-in delay-3" style={{ marginTop: "20px" }}>
        <div className="panel-header">
          <div className="panel-title">
            ✨ Smart Recommendations ({insights.length})
          </div>
          {unreadCount > 0 && (
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--accent-amber)",
                fontWeight: 600,
              }}
            >
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="panel-body" style={{ padding: "0px" }}>
          <div className="insights-list">
            {insights.map((insight) => {
              const isRead = readKeys.has(insight.key);
              return (
                <div
                  key={insight.key}
                  className={`insight-item type-${insight.type} ${isRead ? "insight-read" : ""}`}
                  onClick={() => handleInsightClick(insight)}
                  style={{
                    cursor: "pointer",
                    opacity: isRead ? 0.6 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <div className="insight-icon">
                    {insight.type === "error" && (
                      <AlertCircle size={18} className="val-rose" />
                    )}
                    {insight.type === "warning" && (
                      <AlertTriangle size={18} className="val-amber" />
                    )}
                    {insight.type === "info" && (
                      <Info size={18} className="val-emerald" />
                    )}
                  </div>
                  <div className="insight-content" style={{ flex: 1 }}>
                    <div
                      className="insight-title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {insight.title}
                      {isRead && (
                        <CheckCircle2
                          size={12}
                          style={{
                            color: "var(--accent-emerald)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                    <div className="insight-message">{insight.message}</div>
                  </div>
                  <ChevronRight
                    size={16}
                    style={{
                      color: "var(--text-500)",
                      flexShrink: 0,
                      marginLeft: "8px",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedInsight &&
        createPortal(
          <InsightDetailModal
            insight={selectedInsight}
            onClose={() => setSelectedInsight(null)}
          />,
          document.body,
        )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(2, 2, 8, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          padding: 2rem;
          box-sizing: border-box;
        }
        .modal-content {
          background: #111318;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 16px;
          width: 100%;
          max-width: 560px;
          max-height: 80vh;
          overflow: hidden;
          box-shadow: 0 32px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06);
        }
        .insight-item:hover {
          background: rgba(255,255,255,0.03) !important;
          transform: translateX(2px);
        }
        .insight-read .insight-title {
          text-decoration: line-through;
          text-decoration-color: rgba(255,255,255,0.15);
        }
      `}</style>
    </>
  );
}
