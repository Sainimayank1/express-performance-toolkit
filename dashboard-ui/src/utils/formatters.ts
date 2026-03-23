export const fNum = (n: number) => n?.toLocaleString() || '0';
export const fPct = (n: number, total: number) => total > 0 ? ((n / total) * 100).toFixed(1) : '0';

export const formatUptime = (ms: number) => {
  if (!ms) return "00:00:00";
  const s = Math.floor((ms / 1000) % 60).toString().padStart(2, "0");
  const m = Math.floor((ms / (1000 * 60)) % 60).toString().padStart(2, "0");
  const h = Math.floor(ms / (1000 * 60 * 60)).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

export const fTime = (ts: number) => new Date(ts).toISOString().split("T")[1].slice(0, 12);

export const getTimeClass = (ms: number) => ms < 200 ? 'time-fast' : (ms < 1000 ? 'time-med' : 'time-slow');

export const getStatusClass = (code: number) => code < 300 ? 's2xx' : (code < 400 ? 's3xx' : (code < 500 ? 's4xx' : 's5xx'));
