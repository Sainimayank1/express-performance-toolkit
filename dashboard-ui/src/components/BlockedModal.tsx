import { X, ShieldAlert, Clock, Globe } from "lucide-react";
import type { BlockedEvent } from "../hooks/useMetrics";

interface BlockedModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: BlockedEvent[];
}

export function BlockedModal({ isOpen, onClose, events }: BlockedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <ShieldAlert
              size={20}
              className="val-rose"
              style={{ marginRight: 10 }}
            />
            Blocked IP Monitor
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No blocked traffic detected yet.</p>
            </div>
          ) : (
            <div className="blocked-list">
              <table className="routes-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>IP Address</th>
                    <th>Method</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {[...events].reverse().map((event, i) => (
                    <tr key={i}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: "0.8rem",
                            color: "var(--text-400)",
                          }}
                        >
                          <Clock size={12} />
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontWeight: 600,
                          }}
                        >
                          <Globe size={12} className="val-rose" />
                          {event.ip}
                        </div>
                      </td>
                      <td>
                        <span
                          className={`method-badge ${event.method.toLowerCase()}`}
                        >
                          {event.method}
                        </span>
                      </td>
                      <td
                        style={{ fontFamily: "monospace", fontSize: "0.9rem" }}
                      >
                        {event.path}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p style={{ fontSize: "0.8rem", color: "var(--text-400)" }}>
            Showing last {events.length} security events. Use this data to
            identify brute-force patterns.
          </p>
        </div>
      </div>
    </div>
  );
}
