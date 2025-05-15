/// <reference lib="dom" />

import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { AnalyticsManager } from "./analytics";

describe("AnalyticsManager", () => {
  let analyticsManager: AnalyticsManager;
  const originalNodeEnv = process.env.NODE_ENV;
  let originalIsBrowser: boolean;

  beforeEach(() => {
    // Store original isBrowser value
    originalIsBrowser = (global as any).isBrowser;

    // Set to browser environment for testing
    (global as any).isBrowser = true;

    // Add necessary properties that aren't in happy-dom by default
    window.dataLayer = [];
    window.gtag = mock(() => {});

    // Set NODE_ENV to production for tests
    process.env.NODE_ENV = "production";

    // Create fresh analytics manager for each test
    analyticsManager = new AnalyticsManager(
      "test-ga-id",
      "test-gtm-id",
      "test-ph-key",
      "test-version"
    );
  });

  afterEach(() => {
    // Reset mocks
    mock.restore();

    // Restore original values
    (global as any).isBrowser = originalIsBrowser;
    process.env.NODE_ENV = originalNodeEnv;

    // Clear localStorage
    localStorage.clear();
  });

  test("analytics manager is created with correct properties", () => {
    expect(analyticsManager).toBeDefined();
    expect((analyticsManager as any).gaMeasurementId).toBe("test-ga-id");
    expect((analyticsManager as any).posthogApiKey).toBe("test-ph-key");
    expect((analyticsManager as any).siteVersion).toBe("test-version");
  });

  test('getConsent returns "unknown" when no consent is stored', () => {
    const consent = analyticsManager.getConsent();
    expect(consent).toBe("unknown");
  });

  test("getConsent returns stored consent value", () => {
    // Set values in localStorage
    localStorage.setItem("cookie-consent", "accepted");
    expect(analyticsManager.getConsent()).toBe("accepted");

    localStorage.setItem("cookie-consent", "rejected");
    expect(analyticsManager.getConsent()).toBe("rejected");
  });

  test("updateConsent sets consent in localStorage", () => {
    // Verify no consent value exists initially
    expect(localStorage.getItem("cookie-consent")).toBe(null);

    // Test accepted consent
    analyticsManager.updateConsent("accepted");
    expect(localStorage.getItem("cookie-consent")).toBe("accepted");

    // Test rejected consent
    analyticsManager.updateConsent("rejected");
    expect(localStorage.getItem("cookie-consent")).toBe("rejected");
  });

  test("isEnabled respects explicit user consent", () => {
    // With explicit acceptance
    localStorage.setItem("cookie-consent", "accepted");
    expect(analyticsManager.isEnabled()).toBe(true);

    // With explicit rejection
    localStorage.setItem("cookie-consent", "rejected");
    expect(analyticsManager.isEnabled()).toBe(false);
  });

  test("isEnabled uses country detection for unknown consent", () => {
    // Set up country detection mock
    const mockMetaTag = document.createElement("meta");
    mockMetaTag.setAttribute("name", "cf-ipcountry");

    // Test EU country (Germany)
    mockMetaTag.setAttribute("content", "DE");
    document.head.appendChild(mockMetaTag);
    const querySpy = spyOn(document, "querySelector");
    querySpy.mockImplementation(() => mockMetaTag);
    expect(analyticsManager.isEnabled()).toBe(false);

    // Test non-EU country (United States)
    mockMetaTag.setAttribute("content", "US");
    expect(analyticsManager.isEnabled()).toBe(true);
  });

  test("enableAnalytics initializes tracking when enabled", () => {
    // Spy on private initializeGoogleAnalytics method
    const initializeSpy = spyOn(analyticsManager as any, "initializeGoogleAnalytics");

    // When analytics should be enabled
    const isEnabledSpy = spyOn(analyticsManager, "isEnabled");
    isEnabledSpy.mockImplementation(() => true);

    expect(analyticsManager.enableAnalytics()).toBe(true);
    expect(initializeSpy).toHaveBeenCalled();

    // When analytics should be disabled
    isEnabledSpy.mockImplementation(() => false);
    expect(analyticsManager.enableAnalytics()).toBe(false);

    // Should not call initialize again
    expect(initializeSpy.mock.calls.length).toBe(1);
  });

  test("trackPageView only tracks when analytics is enabled", () => {
    // When analytics is enabled
    const enableSpy = spyOn(analyticsManager, "enableAnalytics");
    enableSpy.mockImplementation(() => true);

    analyticsManager.trackPageView("/test-page");
    expect(window.gtag).toHaveBeenCalled();

    // When analytics is disabled
    window.gtag = mock(() => {}); // Reset the mock
    enableSpy.mockImplementation(() => false);

    analyticsManager.trackPageView("/test-page");
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
