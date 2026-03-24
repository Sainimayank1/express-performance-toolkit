import * as crypto from "crypto";

export interface SessionData {
  authenticated: boolean;
  createdAt: number;
  lastSeen: number;
}

export interface SessionStoreOptions {
  /** Session TTL in milliseconds (default: 24 hours) */
  ttl?: number;
  /** Max sessions to keep in memory (default: 10) */
  maxSessions?: number;
}

/**
 * 🔐 A robust in-memory session store for the performance toolkit dashboard.
 * Provides random session IDs and TTL-based expiration.
 */
export class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private readonly ttl: number;
  private readonly maxSessions: number;

  constructor(options: SessionStoreOptions = {}) {
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // 24 hours
    this.maxSessions = options.maxSessions || 10;

    // Run cleanup every 15 minutes
    setInterval(() => this.cleanup(), 15 * 60 * 1000).unref();
  }

  /**
   * Create a new session and return the session ID.
   */
  create(): string {
    // Basic rate limit for sessions
    if (this.sessions.size >= this.maxSessions) {
      this.cleanup(); // Try to free space
      if (this.sessions.size >= this.maxSessions) {
        // Still full? Remove oldest session
        const oldestKey = this.sessions.keys().next().value;
        if (oldestKey) this.sessions.delete(oldestKey);
      }
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    const now = Date.now();

    this.sessions.set(sessionId, {
      authenticated: true,
      createdAt: now,
      lastSeen: now,
    });

    return sessionId;
  }

  /**
   * Retrieve session data by ID. Returns null if invalid or expired.
   */
  get(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (this.isExpired(session)) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last seen to extend session
    session.lastSeen = Date.now();
    return session;
  }

  /**
   * Destroy a session.
   */
  destroy(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Clear all sessions.
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * Cleanup expired sessions.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (this.isExpired(session, now)) {
        this.sessions.delete(id);
      }
    }
  }

  private isExpired(session: SessionData, now: number = Date.now()): boolean {
    return now - session.lastSeen > this.ttl;
  }

  /**
   * Get count of active sessions.
   */
  get size(): number {
    return this.sessions.size;
  }
}
