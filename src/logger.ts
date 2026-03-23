import { Request, Response, NextFunction } from 'express';
import onFinished from 'on-finished';
import { LoggerOptions, LogEntry } from './types';
import { MetricsStore } from './store';

/**
 * Default log formatter for console output.
 */
function defaultFormatter(entry: LogEntry): string {
  const slow = entry.slow ? ' 🔥 SLOW' : '';
  const cached = entry.cached ? ' [CACHED]' : '';
  const status = entry.statusCode;
  const time = `${entry.responseTime}ms`;

  return `[perf] ${entry.method} ${entry.path} → ${status} ${time}${cached}${slow}`;
}

/**
 * Create request logging & slow API detection middleware.
 */
export function createLoggerMiddleware(
  options: LoggerOptions = {},
  store: MetricsStore
): (req: Request, res: Response, next: NextFunction) => void {
  const {
    slowThreshold = 1000,
    console: logToConsole = true,
    formatter = defaultFormatter,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();

    // Attach perf data to request
    if (!req.perfToolkit) {
      req.perfToolkit = {
        startTime,
        queryCount: 0,
        trackQuery: (label?: string) => {
          req.perfToolkit!.queryCount++;
        },
      };
    }

    onFinished(res, (_err, finishedRes) => {
      const responseTime = Date.now() - startTime;
      const isSlow = responseTime >= slowThreshold;

      const entry: LogEntry = {
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: finishedRes.statusCode,
        responseTime,
        timestamp: Date.now(),
        slow: isSlow,
        cached: res.getHeader('X-Cache') === 'HIT',
        queryCount: req.perfToolkit?.queryCount,
        contentLength: parseInt(res.getHeader('content-length') as string, 10) || undefined,
        userAgent: req.get('user-agent'),
        ip: req.ip,
      };

      // Record in store
      store.addLog(entry);

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
    });

    next();
  };
}
