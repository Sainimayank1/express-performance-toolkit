export const fNum = (n: number) => n?.toLocaleString() || '0';
export function fPct(val: number, total: number): string {
  if (total === 0) return "0";
  return ((val / total) * 100).toFixed(1);
}

export function fBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

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
