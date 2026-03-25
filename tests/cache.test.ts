import { LRUCache } from "../src/tools/cache";

describe("LRUCache", () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>({ maxSize: 3, ttl: 5000 });
  });

  it("should store and retrieve values", () => {
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
  });

  it("should return null for missing keys", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("should evict oldest entry when max size is reached", () => {
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");
    cache.set("d", "4"); // should evict 'a'

    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBe("2");
    expect(cache.get("d")).toBe("4");
    expect(cache.size).toBe(3);
  });

  it("should expire entries after TTL", () => {
    const shortCache = new LRUCache<string>({ maxSize: 10, ttl: 50 });
    shortCache.set("key", "value");
    expect(shortCache.get("key")).toBe("value");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entry = (shortCache as any).cache.get("key");
    entry.createdAt = Date.now() - 100; // expired
    expect(shortCache.get("key")).toBeNull();
  });

  it("should report correct size", () => {
    expect(cache.size).toBe(0);
    cache.set("a", "1");
    expect(cache.size).toBe(1);
    cache.set("b", "2");
    expect(cache.size).toBe(2);
  });

  it("should delete entries", () => {
    cache.set("key", "value");
    expect(cache.delete("key")).toBe(true);
    expect(cache.get("key")).toBeNull();
  });

  it("should clear all entries", () => {
    cache.set("a", "1");
    cache.set("b", "2");
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("should update recently used position on get", () => {
    cache.set("a", "1");
    cache.set("b", "2");
    cache.set("c", "3");

    // Access 'a' to make it recently used
    cache.get("a");

    // Adding 'd' should evict 'b' (now oldest), not 'a'
    cache.set("d", "4");
    expect(cache.get("a")).toBe("1");
    expect(cache.get("b")).toBeNull();
  });
});
