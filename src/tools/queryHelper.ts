import { Request, Response, NextFunction } from "express";
import { QueryHelperOptions } from "../types";
import {
  CONSOLE_RECENT_QUERIES,
  DEFAULT_QUERY_PRE_LABEL,
  DEFAULT_QUERY_THRESHOLD,
} from "../constants";

/**
 * Create query optimization helper middleware.
 * Tracks database queries per request and warns about potential N+1 issues.
 */
export function createQueryHelperMiddleware(
  options: QueryHelperOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const { threshold = DEFAULT_QUERY_THRESHOLD } = options;

  return (req: Request, _res: Response, next: NextFunction): void => {
    const queries: { label: string; timestamp: number }[] = [];

    // Initialize or extend perfToolkit on the request
    if (!req.ept) {
      req.ept = {
        startTime: Date.now(),
        queryCount: 0,
        trackQuery: () => {},
      };
    }

    req.ept.trackQuery = (label?: string): void => {
      req.ept!.queryCount++;
      queries.push({
        label: label || `${DEFAULT_QUERY_PRE_LABEL}-${req.ept!.queryCount}`,
        timestamp: Date.now(),
      });

      // Warn if threshold exceeded
      if (req.ept!.queryCount === threshold) {
        req.ept!.highQueries = true;

        console.warn(
          `[ept] ⚠️  N+1 Alert: ${req.method} ${req.originalUrl || req.url} ` +
            `has made ${threshold}+ queries. Consider optimizing with batch/join queries.`,
        );
        console.warn(
          `[ept]   Recent queries: ${queries
            .slice(-CONSOLE_RECENT_QUERIES)
            .map((q) => q.label)
            .join(", ")}`,
        );
      }
    };

    next();
  };
}
