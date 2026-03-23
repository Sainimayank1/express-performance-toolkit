import { Request, Response, NextFunction } from 'express';
import { QueryHelperOptions } from './types';

/**
 * Create query optimization helper middleware.
 * Tracks database queries per request and warns about potential N+1 issues.
 */
export function createQueryHelperMiddleware(
  options: QueryHelperOptions = {}
): (req: Request, res: Response, next: NextFunction) => void {
  const { threshold = 10 } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const queries: { label: string; timestamp: number }[] = [];

    // Initialize or extend perfToolkit on the request
    if (!req.perfToolkit) {
      req.perfToolkit = {
        startTime: Date.now(),
        queryCount: 0,
        trackQuery: () => {},
      };
    }

    req.perfToolkit.trackQuery = (label?: string): void => {
      req.perfToolkit!.queryCount++;
      queries.push({
        label: label || `query-${req.perfToolkit!.queryCount}`,
        timestamp: Date.now(),
      });

      // Warn if threshold exceeded
      if (req.perfToolkit!.queryCount === threshold) {
        console.warn(
          `[perf] ⚠️  N+1 Alert: ${req.method} ${req.originalUrl || req.url} ` +
            `has made ${threshold}+ queries. Consider optimizing with batch/join queries.`
        );
        console.warn(
          `[perf]   Recent queries: ${queries
            .slice(-5)
            .map((q) => q.label)
            .join(', ')}`
        );
      }
    };

    next();
  };
}
