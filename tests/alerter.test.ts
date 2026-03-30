import { MetricsStore } from "../src/store";
import { createAlertManager } from "../src/tools/alerter";
import { performanceToolkit } from "../src/index";
import { AlertRule, Metrics } from "../src/types";
import { WEBHOOK_FORMAT } from "../src/constants";

// ─── Test Helper ─────────────────────────────────────────────────────

function makeMockStore(overrides: Partial<Metrics> = {}): MetricsStore {
  const store = new MetricsStore();
  const original = store.getMetrics.bind(store);
  store.getMetrics = () => ({ ...original(), ...overrides });
  return store;
}

// ─── AlertManager Unit Tests ──────────────────────────────────────────

describe("AlertManager", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it("should return start, stop, and check methods", () => {
    const store = makeMockStore();
    const alerter = createAlertManager(store, { rules: [] });

    expect(typeof alerter.start).toBe("function");
    expect(typeof alerter.stop).toBe("function");
    expect(typeof alerter.check).toBe("function");
  });

  it("should fire onAlert when a rule threshold is breached", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({ avgResponseTime: 6000 });

    const rule: AlertRule = {
      metric: "avgResponseTime",
      threshold: 5000,
      message: "🔥 Slow API!",
    };

    const alerter = createAlertManager(store, { rules: [rule], onAlert });
    alerter.check();

    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert).toHaveBeenCalledWith(rule, 6000, expect.any(Object));
  });

  it("should NOT fire onAlert when value is within threshold", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({ avgResponseTime: 1000 });

    const alerter = createAlertManager(store, {
      rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      onAlert,
    });
    alerter.check();

    expect(onAlert).not.toHaveBeenCalled();
  });

  // ─── Edge-triggered model tests ───────────────────────────────────────

  it("edge-triggered: should NOT re-fire while metric stays breached (level-triggered guard)", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({ avgResponseTime: 9000 });

    const alerter = createAlertManager(store, {
      rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      onAlert,
    });

    alerter.check(); // fires on first breach
    alerter.check(); // metric still breached → should NOT fire again
    alerter.check(); // metric still breached → should NOT fire again

    expect(onAlert).toHaveBeenCalledTimes(1);
  });

  it("edge-triggered: should re-fire after metric recovers and breaches again", () => {
    const onAlert = jest.fn();

    // Start breached
    const store = makeMockStore({ avgResponseTime: 9000 });
    const alerter = createAlertManager(store, {
      rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      onAlert,
    });

    alerter.check(); // fires — breach #1
    expect(onAlert).toHaveBeenCalledTimes(1);

    // Metric recovers
    store.getMetrics = () => ({
      ...new MetricsStore().getMetrics(),
      avgResponseTime: 100,
    });
    alerter.check(); // below threshold → resets state, no fire

    expect(onAlert).toHaveBeenCalledTimes(1); // still just 1

    store.getMetrics = () => ({
      ...new MetricsStore().getMetrics(),
      avgResponseTime: 9000,
    });
    alerter.check(); // fires — breach #2

    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it("should support dot-notation metric paths (cpuUsage.percent)", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({
      cpuUsage: { user: 0, system: 0, percent: 95 },
    });

    const alerter = createAlertManager(store, {
      rules: [
        { metric: "cpuUsage.percent", threshold: 90, message: "CPU high" },
      ],
      onAlert,
    });
    alerter.check();

    expect(onAlert).toHaveBeenCalledTimes(1);
    expect(onAlert).toHaveBeenCalledWith(
      expect.objectContaining({ metric: "cpuUsage.percent" }),
      95,
      expect.any(Object),
    );
  });

  it("should resolve derived metric memoryUsage.heapPressure correctly", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({
      memoryUsage: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 850_000_000,
        heapLimit: 1_000_000_000,
        external: 0,
      },
    });

    const alerter = createAlertManager(store, {
      rules: [{ metric: "memoryUsage.heapPressure", threshold: 80 }],
      onAlert,
    });
    alerter.check();

    expect(onAlert).toHaveBeenCalledTimes(1);
    // Value should be ~85% (850MB / 1000MB)
    expect(onAlert.mock.calls[0][1]).toBeCloseTo(85, 0);
  });

  it("should support '<=' comparator (breach below threshold)", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({ cacheHitRate: 10 });

    const alerter = createAlertManager(store, {
      rules: [
        {
          metric: "cacheHitRate",
          threshold: 20,
          comparator: "<=",
          message: "Cache miss rate too high",
        },
      ],
      onAlert,
    });
    alerter.check();

    expect(onAlert).toHaveBeenCalledTimes(1);
  });

  it("should NOT fire when an unknown metric path is given", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({});

    const alerter = createAlertManager(store, {
      rules: [{ metric: "nonexistent.deep.value", threshold: 0 }],
      onAlert,
    });
    alerter.check();

    expect(onAlert).not.toHaveBeenCalled();
  });

  it("should fire independent rules independently", () => {
    const onAlert = jest.fn();
    const store = makeMockStore({
      avgResponseTime: 8000,
      cpuUsage: { user: 0, system: 0, percent: 95 },
    });

    const alerter = createAlertManager(store, {
      rules: [
        { metric: "avgResponseTime", threshold: 5000 },
        { metric: "cpuUsage.percent", threshold: 90 },
      ],
      onAlert,
    });
    alerter.check();

    expect(onAlert).toHaveBeenCalledTimes(2);
  });

  it("should start a polling interval and stop it", () => {
    jest.useFakeTimers();
    const onAlert = jest.fn();
    const store = makeMockStore({ avgResponseTime: 9000 });

    const alerter = createAlertManager(store, {
      rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      onAlert,
      intervalMs: 500,
    });

    alerter.start();
    // First interval — fires once (OK → BREACHED)
    jest.advanceTimersByTime(600);
    // Subsequent intervals — metric still breached, stays silent
    jest.advanceTimersByTime(1600);
    alerter.stop();

    // Edge-triggered: only 1 alert regardless of how many poll cycles
    expect(onAlert).toHaveBeenCalledTimes(1);
  });

  it("should handle onAlert callback errors gracefully (no throw)", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const store = makeMockStore({ avgResponseTime: 9000 });

    const alerter = createAlertManager(store, {
      rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      onAlert: () => {
        throw new Error("User callback crashed!");
      },
    });

    expect(() => alerter.check()).not.toThrow();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("onAlert callback error"),
    );

    consoleSpy.mockRestore();
  });

  it("should accept webhooks as plain URL strings (generic format)", () => {
    const store = makeMockStore({ avgResponseTime: 9000 });
    expect(() => {
      createAlertManager(store, {
        webhooks: ["https://example.com/alerts"],
        rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      });
    }).not.toThrow();
  });

  it("should accept webhooks as WebhookConfig objects with format", () => {
    const store = makeMockStore({ avgResponseTime: 9000 });
    expect(() => {
      createAlertManager(store, {
        webhooks: [
          { url: "https://hooks.slack.com/test", format: WEBHOOK_FORMAT.slack },
          {
            url: "https://discord.com/api/webhooks/test",
            format: WEBHOOK_FORMAT.discord,
          },
          { url: "https://custom.service/hook" },
        ],
        rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      });
    }).not.toThrow();
  });
});

// ─── Integration Tests ────────────────────────────────────────────────

describe("Alert integration with performanceToolkit", () => {
  it("should expose alerter on toolkit instance when alerts are configured", () => {
    const toolkit = performanceToolkit({
      logging: false,
      dashboard: false,
      alerts: {
        rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      },
    });

    expect(toolkit.alerter).not.toBeNull();
    expect(typeof toolkit.alerter?.check).toBe("function");

    toolkit.alerter?.stop();
  });

  it("should return null alerter when alerts are not configured", () => {
    const toolkit = performanceToolkit({
      logging: false,
      dashboard: false,
    });

    expect(toolkit.alerter).toBeNull();
  });

  it("should return null alerter when alerts.enabled is false", () => {
    const toolkit = performanceToolkit({
      logging: false,
      dashboard: false,
      alerts: {
        enabled: false,
        rules: [{ metric: "avgResponseTime", threshold: 5000 }],
      },
    });

    expect(toolkit.alerter).toBeNull();
  });
});
