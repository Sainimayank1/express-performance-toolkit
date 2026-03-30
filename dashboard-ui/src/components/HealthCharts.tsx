import { useState } from "preact/hooks";
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  HardDriveDownload,
  Server,
} from "lucide-react";
import { Sparkline } from "./Sparkline";

export type ChartDataPoint = {
  timestamp: number;
  eventLoopLag: number;
  memoryUsed: number;
  cpuPercent: number;
  requests: number;
  errors: number;
};

interface HealthChartsProps {
  history: ChartDataPoint[];
  systemInfo?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpus: number;
    hostname: string;
    totalMemory: number;
    freeMemory: number;
    processId: number;
    uptimeFormatted: string;
  };
  memoryUsage?: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    heapLimit: number;
    external: number;
  };
}

function CircularGauge({
  value,
  label,
  color,
  icon: Icon,
}: {
  value: number;
  label: string;
  color: string;
  icon: React.ElementType;
}) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="var(--gauge-bg)"
            strokeWidth="6"
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-100)",
          }}
        >
          <Icon
            size={16}
            style={{ opacity: 0.6, position: "absolute", top: "22px" }}
          />
          <span
            style={{ fontSize: "0.9rem", fontWeight: 700, marginTop: "12px" }}
          >
            {value}%
          </span>
        </div>
      </div>
      <span
        style={{
          fontSize: "0.7rem",
          color: "var(--text-400)",
          textTransform: "uppercase",
          fontWeight: 600,
          letterSpacing: "0.05em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function HealthCharts({
  history,
  systemInfo,
  memoryUsage,
}: HealthChartsProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const lagData = history.map((d) => d.eventLoopLag);
  const memData = history.map((d) => d.memoryUsed);
  const cpuData = history.map((d) => d.cpuPercent);
  const latest = history[history.length - 1] || {
    eventLoopLag: 0,
    memoryUsed: 0,
    cpuPercent: 0,
    requests: 0,
    errors: 0,
  };

  const handleMouseMove = (e: MouseEvent, container: HTMLDivElement) => {
    if (!history.length) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percentage * (history.length - 1));
    setHoverIndex(index);
  };

  const activeData = hoverIndex !== null ? history[hoverIndex] : null;

  // Calculate process memory percentage (Heap Used vs Heap Limit)
  const heapUsed = memoryUsage?.heapUsed || 0;
  const heapLimit = memoryUsage?.heapLimit || 1.5 * 1024 * 1024 * 1024; // Node default is ~1.5GB
  const memPercent = Math.max(
    0,
    Math.min(100, Math.round((heapUsed / heapLimit) * 100)),
  );

  return (
    <div
      className="panel animate-in delay-3"
      style={{ flex: 1, minHeight: "380px" }}
    >
      <div className="panel-header">
        <div className="panel-title">
          <Activity
            size={18}
            className="pulse-dot"
            style={{ color: "var(--accent-cyan)" }}
          />
          Machine Metrics
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.75rem",
            color: "var(--accent-emerald)",
            fontWeight: 600,
          }}
        >
          <div className="pulse-dot" style={{ width: "6px", height: "6px" }} />
          LIVE OSCILLOSCOPE
        </div>
      </div>

      <div
        className="panel-body"
        style={{
          padding: "1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        {/* Top Section: Gauges & Uptime */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "var(--surface-low)",
            padding: "1.25rem",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div style={{ display: "flex", gap: "2rem" }}>
            <CircularGauge
              value={latest.cpuPercent}
              label="System CPU"
              color="var(--accent-rose)"
              icon={Cpu}
            />
            <CircularGauge
              value={memPercent}
              label="Heap Pressure"
              color="var(--accent-indigo)"
              icon={HardDrive}
            />
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                justifyContent: "flex-end",
                marginBottom: "4px",
              }}
            >
              <Clock size={14} style={{ color: "var(--text-400)" }} />
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-400)",
                  fontWeight: 600,
                }}
              >
                SYSTEM UPTIME
              </span>
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                fontFamily: "var(--font-display)",
                color: "var(--text-100)",
              }}
            >
              {systemInfo?.uptimeFormatted || "0s"}
            </div>
          </div>
        </div>

        {/* Tooltip Overlay */}
        {activeData && (
          <div
            style={{
              backgroundColor: "var(--bg-surface-glass)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              padding: "10px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              position: "absolute",
              zIndex: 100,
              pointerEvents: "none",
              left: "50%",
              top: "140px",
              transform: "translateX(-50%)",
              boxShadow: "var(--shadow-md)",
              minWidth: "160px",
            }}
          >
            <div
              style={{
                fontSize: "0.65rem",
                color: "var(--text-400)",
                fontWeight: 700,
                letterSpacing: "0.05em",
                marginBottom: "4px",
              }}
            >
              SNAPSHOT @ {new Date(activeData.timestamp).toLocaleTimeString()}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-300)" }}>
                Lag
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                {activeData.eventLoopLag}ms
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-300)" }}>
                Memory
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-indigo)", fontWeight: 700 }}>
                {activeData.memoryUsed}MB
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-300)" }}>
                CPU
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--accent-rose)", fontWeight: 700 }}>
                {activeData.cpuPercent}%
              </span>
            </div>
          </div>
        )}

        {/* Middle Section: Mini Charts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1.25rem",
          }}
        >
          <div
            style={{
            backgroundColor: "var(--chart-bg)",
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-400)",
                  fontWeight: 600,
                }}
              >
                LAG
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent-cyan)",
                  fontWeight: 700,
                }}
              >
                {latest.eventLoopLag}ms
              </span>
            </div>
            <div style={{ height: "35px" }}>
              <Sparkline
                data={lagData}
                color="var(--accent-cyan)"
                gradientId="lagGrad"
                activeIndex={hoverIndex}
              />
            </div>
          </div>
          <div
            style={{
            backgroundColor: "var(--chart-bg)",
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            cursor: "crosshair",
            }}
            onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-400)",
                  fontWeight: 600,
                }}
              >
                MEMORY
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent-indigo)",
                  fontWeight: 700,
                }}
              >
                {latest.memoryUsed}MB
              </span>
            </div>
            <div style={{ height: "35px" }}>
              <Sparkline
                data={memData}
                color="var(--accent-indigo)"
                gradientId="memGrad"
                activeIndex={hoverIndex}
              />
            </div>
          </div>
          <div
            style={{
            backgroundColor: "var(--chart-bg)",
            padding: "1rem",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
            position: "relative",
            cursor: "crosshair",
            }}
            onMouseMove={(e) => handleMouseMove(e, e.currentTarget)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-400)",
                  fontWeight: 600,
                }}
              >
                CPU LOAD
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--accent-rose)",
                  fontWeight: 700,
                }}
              >
                {latest.cpuPercent}%
              </span>
            </div>
            <div style={{ height: "35px" }}>
              <Sparkline
                data={cpuData}
                color="var(--accent-rose)"
                gradientId="cpuGrad"
                activeIndex={hoverIndex}
              />
            </div>
          </div>
        </div>

        {/* Bottom Section: System Specs */}
        {systemInfo && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              paddingTop: "0.5rem",
            }}
          >
            <div className="spec-card">
              <Server
                size={14}
                style={{ color: "var(--accent-cyan)", marginBottom: "4px" }}
              />
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                HOSTNAME
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-200)",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {systemInfo.hostname}
              </div>
            </div>
            <div className="spec-card">
              <Cpu
                size={14}
                style={{ color: "var(--accent-rose)", marginBottom: "4px" }}
              />
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                PLATFORM
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-200)",
                  fontWeight: 500,
                }}
              >
                {systemInfo.platform} ({systemInfo.arch})
              </div>
            </div>
            <div className="spec-card">
              <HardDriveDownload
                size={14}
                style={{ color: "var(--accent-amber)", marginBottom: "4px" }}
              />
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                NODE.JS
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-200)",
                  fontWeight: 500,
                }}
              >
                {systemInfo.nodeVersion}
              </div>
            </div>
            <div className="spec-card">
              <Activity
                size={14}
                style={{ color: "var(--accent-emerald)", marginBottom: "4px" }}
              />
              <div
                style={{
                  fontSize: "0.65rem",
                  color: "var(--text-500)",
                  fontWeight: 600,
                }}
              >
                CORES / PID
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-200)",
                  fontWeight: 500,
                }}
              >
                {systemInfo.cpus}C / {systemInfo.processId}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .spec-card {
          padding: 8px;
          border-left: 1px solid var(--border-subtle);
        }
      `}</style>
    </div>
  );
}
