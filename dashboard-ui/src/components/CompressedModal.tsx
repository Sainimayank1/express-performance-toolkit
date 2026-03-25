import { X, Clock, FileArchive } from "lucide-react";
import type { CompressedEvent } from "../hooks/useMetrics";
import { fBytes } from "../utils/formatters";
import { useEffect } from "react";
import { createPortal } from "react-dom";

interface CompressedModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CompressedEvent[];
}

export function CompressedModal({
  isOpen,
  onClose,
  events,
}: CompressedModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <FileArchive
              size={20}
              className="val-emerald"
              style={{ marginRight: 10 }}
            />
            Compression Optimization Monitor
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {events.length === 0 ? (
            <div className="empty-state">
              <p>No compressed traffic detected yet.</p>
            </div>
          ) : (
            <div className="blocked-list">
              <table className="routes-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Method</th>
                    <th>Path</th>
                    <th>Original</th>
                    <th>Compressed</th>
                    <th>Ratio</th>
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
                      <td style={{ color: "var(--text-400)" }}>
                        {fBytes(event.originalSize)}
                      </td>
                      <td className="val-emerald" style={{ fontWeight: 600 }}>
                        {fBytes(event.compressedSize)}
                      </td>
                      <td className="val-emerald" style={{ fontWeight: 600 }}>
                        {event.ratio}%
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
            Showing last {events.length} compression events. EPT uses
            Gzip/Deflate/Brotli to reduce bandwidth usage and improve page load
            times.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
