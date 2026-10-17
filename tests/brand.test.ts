import { afterEach, describe, expect, it } from "vitest";
import { brand, otpSmsBody } from "@/config/brand";
import { assertDemoSafe, demoCodesVisible } from "@/lib/demo";
import { createMonitor } from "@/lib/log";

const previous = {
  NODE_ENV: process.env.NODE_ENV,
  DEMO_MODE: process.env.DEMO_MODE,
  DEMO_OTP_VISIBLE: process.env.DEMO_OTP_VISIBLE,
  ALLOW_DEMO_IN_PROD: process.env.ALLOW_DEMO_IN_PROD,
  NEXT_PHASE: process.env.NEXT_PHASE,
};

afterEach(() => {
  restore("NODE_ENV", previous.NODE_ENV);
  restore("DEMO_MODE", previous.DEMO_MODE);
  restore("DEMO_OTP_VISIBLE", previous.DEMO_OTP_VISIBLE);
  restore("ALLOW_DEMO_IN_PROD", previous.ALLOW_DEMO_IN_PROD);
  restore("NEXT_PHASE", previous.NEXT_PHASE);
});

function restore(key: string, value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

function setEnv(key: string, value: string | undefined) {
  restore(key, value);
}

describe("brand", () => {
  it("names the product once", () => {
    expect(brand.name).toBe("Pamoja IQ");
    expect(brand.tagline).toBe("Intelligent Chama Solution");
    expect(otpSmsBody("123456")).toBe("Pamoja IQ code: 123456. It expires in 5 minutes.");
    expect(otpSmsBody("123456").length).toBeLessThanOrEqual(160);
  });
});

describe("demo mode", () => {
  it("refuses a production start when demo mode is on", () => {
    setEnv("NODE_ENV", "production");
    setEnv("DEMO_MODE", "true");
    setEnv("ALLOW_DEMO_IN_PROD", undefined);
    expect(() => assertDemoSafe()).toThrow(/DEMO_MODE/);
  });

  it("allows an explicit production demo", () => {
    setEnv("NODE_ENV", "production");
    setEnv("DEMO_MODE", "true");
    setEnv("ALLOW_DEMO_IN_PROD", "true");
    expect(() => assertDemoSafe()).not.toThrow();
    expect(demoCodesVisible()).toBe(true);
  });

  it("hides codes in production when demo mode is off", () => {
    setEnv("NODE_ENV", "production");
    setEnv("DEMO_MODE", undefined);
    setEnv("DEMO_OTP_VISIBLE", undefined);
    setEnv("ALLOW_DEMO_IN_PROD", undefined);
    expect(demoCodesVisible()).toBe(false);
  });

  it("does not block the production build step", () => {
    setEnv("NODE_ENV", "production");
    setEnv("DEMO_MODE", "true");
    setEnv("NEXT_PHASE", "phase-production-build");
    setEnv("ALLOW_DEMO_IN_PROD", undefined);
    expect(() => assertDemoSafe()).not.toThrow();
  });
});

describe("error monitor", () => {
  it("stays silent without a DSN and records when one is set", () => {
    const lines: string[] = [];
    createMonitor(undefined, (line) => lines.push(line)).captureException(new Error("hidden"));
    expect(lines).toEqual([]);
    createMonitor("https://example.ingest", (line) => lines.push(line)).captureException(new Error("visible"));
    expect(lines[0]).toContain("visible");
    expect(lines[0]).not.toContain("https://example.ingest");
  });
});
