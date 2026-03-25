import { Request, Response, NextFunction } from "express";
import compressionMiddleware from "compression";
import { CompressionOptions } from "../types";
import {
  DEFAULT_DASHBOARD_PATH,
  NO_COMPRESSION_HEADER,
  API_METRICS_PATH,
  API_RESET_PATH,
  CONTENT_ENCODING,
} from "../constants";
import { MetricsStore } from "../store";

/**
 * Create compression middleware with sensible defaults.
 */
export function createCompressionMiddleware(
  options: CompressionOptions = {},
  store?: MetricsStore,
): (req: Request, res: Response, next: NextFunction) => void {
  const { threshold = 1024, level = 6 } = options;

  const compress = compressionMiddleware({
    threshold,
    level,
    filter: (req: Request, res: Response): boolean => {
      // Don't compress if the client didn't request it
      if (req.headers[NO_COMPRESSION_HEADER]) {
        return false;
      }
      // Use compression's default filter
      return compressionMiddleware.filter(req, res);
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    if (!store) return compress(req, res, next);

    let originalSize = 0;
    let compressedSize = 0;

    // 1. Wrap original methods to count compressed bytes (downstream to socket)
    const socketWrite = res.write;
    const socketEnd = res.end;

    res.write = function (...args: any[]) {
      const chunk = args[0];
      if (chunk) {
        compressedSize += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(chunk);
      }
      return socketWrite.apply(res, args as any);
    } as any;

    res.end = function (...args: any[]) {
      const chunk = args[0];
      if (chunk) {
        compressedSize += Buffer.isBuffer(chunk)
          ? chunk.length
          : Buffer.byteLength(chunk);
      }
      return socketEnd.apply(res, args as any);
    } as any;

    // 2. Run compression middleware
    compress(req, res, () => {
      // 3. Wrap again to count original bytes (upstream from compression)
      const middlewareWrite = res.write;
      const middlewareEnd = res.end;

      res.write = function (...args: any[]) {
        const chunk = args[0];
        if (chunk) {
          originalSize += Buffer.isBuffer(chunk)
            ? chunk.length
            : Buffer.byteLength(chunk);
        }
        return middlewareWrite.apply(res, args as any);
      } as any;

      res.end = function (...args: any[]) {
        const chunk = args[0];
        if (chunk) {
          originalSize += Buffer.isBuffer(chunk)
            ? chunk.length
            : Buffer.byteLength(chunk);
        }
        return middlewareEnd.apply(res, args as any);
      } as any;

      res.on("finish", () => {
        const reqPath = req.originalUrl || req.url;

        // Skip internal toolkit paths
        if (
          reqPath.startsWith(DEFAULT_DASHBOARD_PATH) ||
          reqPath.includes(API_METRICS_PATH) ||
          reqPath.includes(API_RESET_PATH)
        ) {
          return;
        }

        const contentEncoding = res.get("Content-Encoding");
        const isCompressed = CONTENT_ENCODING.includes(contentEncoding || "");

        if (isCompressed && originalSize > 0 && compressedSize > 0) {
          store.recordCompression(
            reqPath,
            req.method,
            originalSize,
            compressedSize,
          );
        }
      });

      next();
    });
  };
}
