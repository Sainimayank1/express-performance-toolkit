import { performanceToolkit } from "../src/index";

describe("performanceToolkit options precedence", () => {
  it("should allow disabling a feature via an options object", () => {
    // Before the fix, this would have resulted in cache being enabled because
    // normalizeOption would spread { enabled: false } and then overwrite it with enabled: true.
    const toolkit = performanceToolkit({
      cache: { enabled: false } as any,
    });

    // If cache is disabled, the 'cache' property in the returned instance should be null
    // as per src/index.ts L112 (only assigned if enabled)
    expect(toolkit.cache).toBeNull();
  });

  it("should enable a feature by default if true is passed", () => {
    const toolkit = performanceToolkit({
      cache: true,
    });
    expect(toolkit.cache).not.toBeNull();
  });

  it("should disable a feature by default if false is passed", () => {
    const toolkit = performanceToolkit({
      cache: false,
    });
    expect(toolkit.cache).toBeNull();
  });
});
