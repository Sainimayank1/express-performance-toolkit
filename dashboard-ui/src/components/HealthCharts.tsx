import { Activity, Cpu, HardDrive, Clock, HardDriveDownload, Server } from "lucide-react";
import { Sparkline } from "./Sparkline";

export type ChartDataPoint = {
  time: string;
  lag: number;
  memory: number;
  cpu: number;
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
}

function CircularGauge({ value, label, color, icon: Icon }: { value: number; label: string; color: string; icon: React.ElementType }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: '80px', height: '80px' }}>
        <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.05)"
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
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Icon size={16} style={{ opacity: 0.6, position: 'absolute', top: '22px' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '12px' }}>{value}%</span>
        </div>
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-400)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
    </div>
  );
}

export function HealthCharts({ history, systemInfo }: HealthChartsProps) {
  const lagData = history.map((d) => d.lag);
  const memData = history.map((d) => d.memory);
  const cpuData = history.map((d) => d.cpu);
  
  const latest = history[history.length - 1] || { lag: 0, memory: 0, cpu: 0 };
  
  // Calculate memory percentage
  const memPercent = systemInfo 
    ? Math.round(((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100)
    : 0;

  return (
    <div className="panel animate-in delay-3" style={{ flex: 1, minHeight: "380px" }}>
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={18} className="pulse-dot" style={{ color: 'var(--accent-cyan)' }} />
          Machine Metrics
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
          <div className="pulse-dot" style={{ width: '6px', height: '6px' }} />
          LIVE OSCILLOSCOPE
        </div>
      </div>
      
      <div className="panel-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* Top Section: Gauges & Uptime */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <CircularGauge value={latest.cpu} label="CPU Load" color="var(--accent-rose)" icon={Cpu} />
            <CircularGauge value={memPercent} label="System RAM" color="var(--accent-indigo)" icon={HardDrive} />
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
              <Clock size={14} style={{ color: 'var(--text-400)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-400)', fontWeight: 600 }}>SYSTEM UPTIME</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-100)' }}>
              {systemInfo?.uptimeFormatted || '0s'}
            </div>
          </div>
        </div>

        {/* Middle Section: Mini Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-400)', fontWeight: 600 }}>LAG</span>
               <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{latest.lag}ms</span>
             </div>
             <div style={{ height: '35px' }}>
               <Sparkline data={lagData} color="var(--accent-cyan)" gradientId="lagGrad" />
             </div>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-400)', fontWeight: 600 }}>MEMORY</span>
               <span style={{ fontSize: '0.75rem', color: 'var(--accent-indigo)', fontWeight: 700 }}>{latest.memory}MB</span>
             </div>
             <div style={{ height: '35px' }}>
               <Sparkline data={memData} color="var(--accent-indigo)" gradientId="memGrad" />
             </div>
          </div>
          <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <span style={{ fontSize: '0.7rem', color: 'var(--text-400)', fontWeight: 600 }}>CPU LOAD</span>
               <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 700 }}>{latest.cpu}%</span>
             </div>
             <div style={{ height: '35px' }}>
               <Sparkline data={cpuData} color="var(--accent-rose)" gradientId="cpuGrad" />
             </div>
          </div>
        </div>

        {/* Bottom Section: System Specs */}
        {systemInfo && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '1rem',
            paddingTop: '0.5rem'
          }}>
            <div className="spec-card">
              <Server size={14} style={{ color: 'var(--accent-cyan)', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-500)', fontWeight: 600 }}>HOSTNAME</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-200)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis' }}>{systemInfo.hostname}</div>
            </div>
            <div className="spec-card">
              <Cpu size={14} style={{ color: 'var(--accent-rose)', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-500)', fontWeight: 600 }}>PLATFORM</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-200)', fontWeight: 500 }}>{systemInfo.platform} ({systemInfo.arch})</div>
            </div>
            <div className="spec-card">
              <HardDriveDownload size={14} style={{ color: 'var(--accent-amber)', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-500)', fontWeight: 600 }}>NODE.JS</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-200)', fontWeight: 500 }}>{systemInfo.nodeVersion}</div>
            </div>
            <div className="spec-card">
              <Activity size={14} style={{ color: 'var(--accent-emerald)', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.65rem', color: 'var(--text-500)', fontWeight: 600 }}>CORES / PID</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-200)', fontWeight: 500 }}>{systemInfo.cpus}C / {systemInfo.processId}</div>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .spec-card {
          padding: 8px;
          border-left: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>
    </div>
  );
}
