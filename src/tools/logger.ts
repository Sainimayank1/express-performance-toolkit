import { Request, Response, NextFunction } from "express";
import onFinished from "on-finished";
import * as fs from "fs";
import * as path from "path";
import { LoggerOptions, LogEntry } from "../types";
import { MetricsStore } from "../store";
import {
  DEFAULT_LOG_OPTIONS,
  API_METRICS_PATH,
  API_RESET_PATH,
  DEFAULT_DASHBOARD_PATH,
} from "../constants";

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
                  `[Express Performance Toolkit] Failed to delete old log: ${file}`,
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
  dashboardPath: string = DEFAULT_DASHBOARD_PATH,
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    slowRequestThreshold = DEFAULT_LOG_OPTIONS.slowRequestThreshold,
    console: logToConsole = DEFAULT_LOG_OPTIONS.console,
    file: logFilePath = DEFAULT_LOG_OPTIONS.file,
    rotation = DEFAULT_LOG_OPTIONS.rotation,
    maxDays = DEFAULT_LOG_OPTIONS.maxDays,
    exclude = DEFAULT_LOG_OPTIONS.exclude,
    formatter = DEFAULT_LOG_OPTIONS.formatter,
  } = options;

  let rotator: LogRotator | null = null;
  if (logFilePath) {
    try {
      rotator = new LogRotator(logFilePath, rotation, maxDays);
    } catch (err) {
      console.error(
        `[Express Performance Toolkit] Failed to initialize log rotator: ${err}`,
      );
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
      reqPath.includes(API_METRICS_PATH) ||
      reqPath.includes(API_RESET_PATH) ||
      reqPath.includes(dashboardPath)
    ) {
      return next();
    }

    // Snapshot socket bytes at the start of the request.
    // After the response finishes, the difference gives us the actual
    // bytes written to the wire (compressed body + headers).
    const socketBytesStart = res.socket?.bytesWritten ?? 0;

    // Body-level byte counting via res.write/res.end interception.
    // This is the fallback for environments where socket tracking isn't available
    // (e.g. supertest) and also accurately counts per-response body bytes.
    let bodyBytesSent = 0;
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (...args: any[]) {
      const [chunk, encoding] = args;
      if (chunk) {
        bodyBytesSent += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(
              chunk,
              (typeof encoding === "string"
                ? encoding
                : "utf8") as BufferEncoding,
            );
      }
      return originalWrite.apply(res, args as any);
    };

    res.end = function (...args: any[]): Response {
      const [chunk, encoding] = args;
      if (chunk && typeof chunk !== "function") {
        bodyBytesSent += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(
              chunk,
              (typeof encoding === "string"
                ? encoding
                : "utf8") as BufferEncoding,
            );
      }
      return originalEnd.apply(res, args as any);
    };

    // Attach ept data to request safely
    if (!req.ept) {
      (req as any).ept = {};
    }

    const ept = req.ept!;
    if (!ept.startTime) ept.startTime = startTime;
    if (ept.queryCount === undefined) ept.queryCount = 0;
    if (!ept.trackQuery) {
      ept.trackQuery = () => {
        ept.queryCount = (ept.queryCount || 0) + 1;
      };
    }

    onFinished(res, (_err, finishedRes) => {
      const responseTime = Date.now() - startTime;
      const isSlow = responseTime >= slowRequestThreshold;

      // Extract route pattern if available (e.g. /users/:id)
      const routePattern = (req as any).route?.path;

      // Prefer socket-level bytes (includes headers + compressed body).
      // Fall back to body-level counting if socket tracking is unavailable.
      const socketBytesEnd = finishedRes.socket?.bytesWritten ?? 0;
      const socketDelta = socketBytesEnd - socketBytesStart;
      const bytesSent = socketDelta > 0 ? socketDelta : bodyBytesSent;

      const entry: LogEntry = {
        method: req.method,
        path: reqPath,
        routePattern,
        statusCode: finishedRes.statusCode,
        responseTime,
        timestamp: Date.now(),
        slow: isSlow,
        cached: res.getHeader("X-Cache") === "HIT",
        highQueries: req.ept?.highQueries || false,
        queryCount: req.ept?.queryCount,
        bytesSent,
        userAgent: req.get("user-agent"),
        ip:
          req.ip === "::1" || req.ip === "::ffff:127.0.0.1"
            ? "127.0.0.1"
            : req.ip,
        requestId: req.ept?.requestId,
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
