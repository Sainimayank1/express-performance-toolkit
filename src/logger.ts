import { Request, Response, NextFunction } from "express";
import onFinished from "on-finished";
import * as fs from "fs";
import * as path from "path";
import { LoggerOptions, LogEntry } from "./types";
import { MetricsStore } from "./store";

/**
 * Default log formatter for console output.
 */
function defaultFormatter(entry: LogEntry): string {
  const slow = entry.slow ? " [SLOW]" : "";
  const cached = entry.cached ? " [CACHED]" : "";
  const status = entry.statusCode;
  const time = `${entry.responseTime}ms`;

  return `[perf] ${entry.method} ${entry.path} → ${status} ${time}${cached}${slow}`;
}

/**
 * Helper class for managing log file rotation and cleanup.
 */
class LogRotator {
  private currentStream: fs.WriteStream | null = null;
  private currentDateStr: string = "";
  private basePath: string;
  private logDir: string;
  private rotation: boolean;
  private maxDays: number;

  constructor(filePath: string, rotation: boolean, maxDays: number) {
    this.basePath = path.resolve(process.cwd(), filePath);
    this.logDir = path.dirname(this.basePath);
    this.rotation = rotation;
    this.maxDays = maxDays;

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    this.getStream(); // Initialize
  }

  private getDateStr(date: Date = new Date()): string {
    return date.toISOString().split("T")[0];
  }

  private getRotatedPath(dateStr: string): string {
    if (!this.rotation) return this.basePath;
    const ext = path.extname(this.basePath);
    const base = path.basename(this.basePath, ext);
    return path.join(this.logDir, `${base}-${dateStr}${ext}`);
  }

  public getStream(): fs.WriteStream {
    if (!this.rotation) {
      if (!this.currentStream) {
        this.currentStream = fs.createWriteStream(this.basePath, {
          flags: "a",
        });
      }
      return this.currentStream;
    }

    const todayStr = this.getDateStr();
    if (this.currentDateStr !== todayStr) {
      if (this.currentStream) {
        this.currentStream.end();
      }
      this.currentDateStr = todayStr;
      const newPath = this.getRotatedPath(todayStr);
      this.currentStream = fs.createWriteStream(newPath, { flags: "a" });

      // Run cleanup asynchronously in the background
      this.cleanupOldLogs();
    }
    return this.currentStream!;
  }

  private cleanupOldLogs() {
    if (!this.rotation || this.maxDays <= 0) return;

    fs.readdir(this.logDir, (err, files) => {
      if (err) return;

      const ext = path.extname(this.basePath);
      const base = path.basename(this.basePath, ext);
      const prefix = `${base}-`;

      const now = Date.now();
      const maxAgeMs = this.maxDays * 24 * 60 * 60 * 1000;

      files.forEach((file) => {
        if (file.startsWith(prefix) && file.endsWith(ext)) {
          const datePart = file.slice(prefix.length, -ext.length);
          const fileDate = new Date(datePart).getTime();

          if (!isNaN(fileDate) && now - fileDate > maxAgeMs) {
            fs.unlink(path.join(this.logDir, file), (unlinkErr) => {
              if (unlinkErr)
                console.error(
                  `[perf-toolkit] Failed to delete old log: ${file}`,
                );
            });
          }
        }
      });
    });
  }
}

/**
 * Create request logging & slow API detection middleware.
 */
export function createLoggerMiddleware(
  options: LoggerOptions = {},
  store: MetricsStore,
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    slowThreshold = 1000,
    console: logToConsole = true,
    file: logFilePath,
    rotation = false,
    maxDays = 7,
    exclude = [],
    formatter = defaultFormatter,
  } = options;

  let rotator: LogRotator | null = null;
  if (logFilePath) {
    try {
      rotator = new LogRotator(logFilePath, rotation, maxDays);
    } catch (err) {
      console.error(`[perf-toolkit] Failed to initialize log rotator: ${err}`);
    }
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const reqPath = req.originalUrl || req.url;

    // Check exclusions
    const isExcluded = exclude.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(reqPath);
      if (typeof pattern === "string") {
        return (
          reqPath === pattern ||
          reqPath.startsWith(pattern + "/") ||
          reqPath.startsWith(pattern + "?")
        );
      }
      return false;
    });

    if (
      isExcluded ||
      reqPath.includes("/metrics") ||
      reqPath.includes("/reset") ||
      reqPath.includes("/__perf")
    ) {
      return next();
    }

    // Byte counting logic
    let bytesSent = 0;
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (
      chunk: any,
      encoding?: any,
      _callback?: any,
    ): boolean {
      if (chunk) {
        bytesSent += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(
              chunk,
              (typeof encoding === "string"
                ? encoding
                : "utf8") as BufferEncoding,
            );
      }
      return originalWrite.apply(res, arguments as any);
    };

    res.end = function (chunk: any, encoding?: any, _callback?: any): Response {
      if (chunk && typeof chunk !== "function") {
        bytesSent += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(
              chunk,
              (typeof encoding === "string"
                ? encoding
                : "utf8") as BufferEncoding,
            );
      }
      return originalEnd.apply(res, arguments as any);
    };

    // Attach perf data to request
    if (!req.perfToolkit) {
      req.perfToolkit = {
        startTime,
        queryCount: 0,
        trackQuery: () => {
          req.perfToolkit!.queryCount++;
        },
      };
    }

    onFinished(res, (_err, finishedRes) => {
      const responseTime = Date.now() - startTime;
      const isSlow = responseTime >= slowThreshold;

      // Extract route pattern if available (e.g. /users/:id)
      const routePattern = (req as any).route?.path;

      const entry: LogEntry = {
        method: req.method,
        path: reqPath,
        routePattern,
        statusCode: finishedRes.statusCode,
        responseTime,
        timestamp: Date.now(),
        slow: isSlow,
        cached: res.getHeader("X-Cache") === "HIT",
        highQueries: req.perfToolkit?.highQueries || false,
        queryCount: req.perfToolkit?.queryCount,
        bytesSent,
        userAgent: req.get("user-agent"),
        ip: req.ip,
      };

      // Record in store
      store.recordLog(entry);

      if (isSlow) {
        store.recordSlowRequest();
      }

      // Console output
      if (logToConsole) {
        const message = formatter(entry);
        if (isSlow) {
          console.warn(message);
        } else {
          console.log(message);
        }
      }

      // File output
      if (rotator) {
        const logLine = JSON.stringify(entry) + "\n";
        rotator.getStream().write(logLine);
      }
    });

    next();
  };
}
