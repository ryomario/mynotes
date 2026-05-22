// src/utils/i18n.test.ts
import { describe, test, expect, beforeEach, afterAll } from "vitest";
import { getCurrentLanguage, saveLanguageSetting, t } from "./i18n";

describe("i18n utilities", () => {
  const originalLocalStorage = { ...globalThis.localStorage };

  beforeEach(() => {
    // Reset localStorage for each test
    const store: Record<string, string> = {};
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem(key: string) {
          return store[key] ?? null;
        },
        setItem(key: string, value: string) {
          store[key] = value;
        },
        removeItem(key: string) {
          delete store[key];
        },
        clear() {
          for (const k in store) delete store[k];
        },
        key(index: number) {
          return Object.keys(store)[index] ?? null;
        },
        length: 0,
      },
      configurable: true,
    });
    // Ensure empty settings
    globalThis.localStorage.clear();
  });

  afterAll(() => {
    // Restore original localStorage
    Object.defineProperty(globalThis, "localStorage", { value: originalLocalStorage });
  });

  test("defaults to English when no setting", () => {
    expect(getCurrentLanguage()).toBe("en");
  });

  test("saves and retrieves language setting", () => {
    saveLanguageSetting("id");
    expect(getCurrentLanguage()).toBe("id");
  });

  test("translation fallback works", () => {
    // english translation exists in en.json, but we test fallback behavior by using a missing key
    const missingKey = "nonexistent_key";
    expect(t(missingKey)).toBe(missingKey);
  });
});
