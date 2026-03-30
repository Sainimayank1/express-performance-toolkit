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
 * Calculate the byte length of a chunk of data.
 */
function getByteLength(chunk: any, encoding?: string): number {
  if (!chunk) return 0;
  return Buffer.isBuffer(chunk)
    ? chunk.length
    : Buffer.byteLength(chunk, (encoding || "utf8") as BufferEncoding);
}

/**
 * Create compression middleware with sensible defaults.
 */
export function createCompressionMiddleware(
  options: CompressionOptions = {},
  store?: MetricsStore,
  dashboardPath: string = DEFAULT_DASHBOARD_PATH,
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
    const socketWrite = res.write.bind(res);
    const socketEnd = res.end.bind(res);

    (res as any).write = (chunk: any, encoding: any, callback: any) => {
      compressedSize += getByteLength(chunk, encoding);
      return socketWrite(chunk, encoding, callback);
    };

    (res as any).end = (chunk: any, encoding: any, callback: any) => {
      compressedSize += getByteLength(chunk, encoding);
      return socketEnd(chunk, encoding, callback);
    };

    // 2. Run compression middleware
    compress(req, res, () => {
      // 3. Wrap again to count original bytes (upstream from compression)
      const middlewareWrite = res.write.bind(res);
      const middlewareEnd = res.end.bind(res);

      (res as any).write = (chunk: any, encoding: any, callback: any) => {
        originalSize += getByteLength(chunk, encoding);
        return middlewareWrite(chunk, encoding, callback);
      };

      (res as any).end = (chunk: any, encoding: any, callback: any) => {
        originalSize += getByteLength(chunk, encoding);
        return middlewareEnd(chunk, encoding, callback);
      };

      res.on("finish", () => {
        const reqPath = req.originalUrl || req.url;

        // Skip internal toolkit paths
        if (
          reqPath.startsWith(dashboardPath) ||
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
