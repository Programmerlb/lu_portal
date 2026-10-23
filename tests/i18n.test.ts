import { describe, it, expect } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flatten(v as Record<string, unknown>, key));
    } else {
      out[key] = String(v);
    }
  }
  return out;
}

describe("i18n dictionaries", () => {
  it("English and Arabic share the same key set", () => {
    const en = Object.keys(flatten(dictionaries.en as unknown as Record<string, unknown>)).sort();
    const ar = Object.keys(flatten(dictionaries.ar as unknown as Record<string, unknown>)).sort();
    expect(ar).toEqual(en);
  });
  it("no empty English string", () => {
    const en = flatten(dictionaries.en as unknown as Record<string, unknown>);
    for (const [k, v] of Object.entries(en)) expect(v.length, k).toBeGreaterThan(0);
  });
  it("no empty Arabic string", () => {
    const ar = flatten(dictionaries.ar as unknown as Record<string, unknown>);
    for (const [k, v] of Object.entries(ar)) expect(v.length, k).toBeGreaterThan(0);
  });
  it("Arabic nav labels differ from English", () => {
    const en = flatten(dictionaries.en as unknown as Record<string, unknown>);
    const ar = flatten(dictionaries.ar as unknown as Record<string, unknown>);
    for (const k of Object.keys(en).filter((k) => k.startsWith("nav."))) {
      expect(ar[k], k).not.toBe(en[k]);
    }
  });
});
