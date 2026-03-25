import { Request, Response, NextFunction } from "express";
import compressionMiddleware from "compression";
import { CompressionOptions } from "../types";
import { NO_COMPRESSION_HEADER } from "../constants";

/**
 * Create compression middleware with sensible defaults.
 */
export function createCompressionMiddleware(
  options: CompressionOptions = {},
): (req: Request, res: Response, next: NextFunction) => void {
  const { threshold = 1024, level = 6 } = options;

  return compressionMiddleware({
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
}
