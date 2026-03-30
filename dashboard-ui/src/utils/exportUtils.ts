import type { MetricsData, LogEntry } from "../hooks/useMetrics";

/**
 * Downloads data as a JSON file.
 */
export const downloadJSON = (data: MetricsData, filename: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Downloads log data as a CSV file.
 */
export const downloadCSV = (logs: LogEntry[], filename: string) => {
  if (logs.length === 0) return;

  const headers = [
    "Timestamp",
    "Method",
    "Path",
    "Status",
    "Latency(ms)",
    "Cached",
    "RequestID",
  ];
  const rows = logs.map((log) => [
    new Date(log.timestamp).toISOString(),
    log.method,
    log.path,
    log.statusCode,
    log.responseTime,
    log.cached ? "Yes" : "No",
    log.requestId || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
