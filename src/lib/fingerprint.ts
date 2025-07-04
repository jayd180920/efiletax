import crypto from "crypto";

export interface BrowserFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  colorDepth: number;
  cookieEnabled: boolean;
  doNotTrack: string;
  plugins: string[];
  canvas?: string;
  webgl?: string;
}

export interface FingerprintAnalysis {
  hash: string;
  riskScore: number;
  isNewDevice: boolean;
  suspiciousFeatures: string[];
  confidence: number;
}

class FingerprintService {
  // Generate a hash from browser fingerprint data
  generateHash(fingerprint: BrowserFingerprint): string {
    const data = JSON.stringify({
      userAgent: fingerprint.userAgent,
      language: fingerprint.language,
      platform: fingerprint.platform,
      screenResolution: fingerprint.screenResolution,
      timezone: fingerprint.timezone,
      colorDepth: fingerprint.colorDepth,
      cookieEnabled: fingerprint.cookieEnabled,
      doNotTrack: fingerprint.doNotTrack,
      plugins: fingerprint.plugins.sort(), // Sort for consistency
      canvas: fingerprint.canvas,
      webgl: fingerprint.webgl,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  // Analyze fingerprint for suspicious characteristics
  analyzeFingerprint(
    fingerprint: BrowserFingerprint,
    knownFingerprints: string[] = []
  ): FingerprintAnalysis {
    const hash = this.generateHash(fingerprint);
    const isNewDevice = !knownFingerprints.includes(hash);
    const suspiciousFeatures: string[] = [];
    let riskScore = 0;

    // Check for suspicious user agent patterns
    if (this.isSuspiciousUserAgent(fingerprint.userAgent)) {
      suspiciousFeatures.push("suspicious_user_agent");
      riskScore += 3;
    }

    // Check for automation indicators
    if (this.hasAutomationIndicators(fingerprint)) {
      suspiciousFeatures.push("automation_indicators");
      riskScore += 5;
    }

    // Check for unusual screen resolution
    if (this.isUnusualScreenResolution(fingerprint.screenResolution)) {
      suspiciousFeatures.push("unusual_screen_resolution");
      riskScore += 2;
    }

    // Check for missing or unusual plugins
    if (this.hasUnusualPlugins(fingerprint.plugins)) {
      suspiciousFeatures.push("unusual_plugins");
      riskScore += 2;
    }

    // Check for headless browser indicators
    if (this.isHeadlessBrowser(fingerprint)) {
      suspiciousFeatures.push("headless_browser");
      riskScore += 4;
    }

    // New device adds to risk score
    if (isNewDevice) {
      riskScore += 1;
    }

    // Calculate confidence based on available data
    const confidence = this.calculateConfidence(fingerprint);

    return {
      hash,
      riskScore: Math.min(riskScore, 10), // Cap at 10
      isNewDevice,
      suspiciousFeatures,
      confidence,
    };
  }

  // Check for suspicious user agent patterns
  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /headless/i,
      /phantom/i,
      /selenium/i,
      /webdriver/i,
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /automation/i,
      /puppeteer/i,
      /playwright/i,
    ];

    return suspiciousPatterns.some((pattern) => pattern.test(userAgent));
  }

  // Check for automation indicators
  private hasAutomationIndicators(fingerprint: BrowserFingerprint): boolean {
    // Check for webdriver property (common in automated browsers)
    if (fingerprint.userAgent.includes("webdriver")) {
      return true;
    }

    // Check for unusual plugin combinations
    if (fingerprint.plugins.length === 0) {
      return true; // Most real browsers have some plugins
    }

    return false;
  }

  // Check for unusual screen resolutions
  private isUnusualScreenResolution(resolution: string): boolean {
    const [width, height] = resolution.split("x").map(Number);

    // Very small or very large resolutions might be suspicious
    if (width < 800 || height < 600) {
      return true;
    }

    if (width > 4000 || height > 3000) {
      return true;
    }

    return false;
  }

  // Check for unusual plugin configurations
  private hasUnusualPlugins(plugins: string[]): boolean {
    // Most modern browsers have at least a few plugins
    if (plugins.length === 0) {
      return true;
    }

    // Check for automation-related plugins
    const automationPlugins = [
      "webdriver",
      "selenium",
      "phantom",
      "automation",
    ];

    return plugins.some((plugin) =>
      automationPlugins.some((auto) => plugin.toLowerCase().includes(auto))
    );
  }

  // Check for headless browser indicators
  private isHeadlessBrowser(fingerprint: BrowserFingerprint): boolean {
    // Headless browsers often have specific characteristics
    if (fingerprint.userAgent.toLowerCase().includes("headless")) {
      return true;
    }

    // Check for missing canvas or webgl support (common in headless)
    if (!fingerprint.canvas && !fingerprint.webgl) {
      return true;
    }

    return false;
  }

  // Calculate confidence score based on available fingerprint data
  private calculateConfidence(fingerprint: BrowserFingerprint): number {
    let score = 0;
    const maxScore = 10;

    // User agent provides good identification
    if (fingerprint.userAgent && fingerprint.userAgent.length > 50) {
      score += 2;
    }

    // Screen resolution is fairly unique
    if (fingerprint.screenResolution) {
      score += 1;
    }

    // Timezone helps with identification
    if (fingerprint.timezone) {
      score += 1;
    }

    // Plugin list is quite identifying
    if (fingerprint.plugins && fingerprint.plugins.length > 0) {
      score += 2;
    }

    // Canvas fingerprint is highly identifying
    if (fingerprint.canvas) {
      score += 2;
    }

    // WebGL fingerprint is also highly identifying
    if (fingerprint.webgl) {
      score += 2;
    }

    return Math.min(score / maxScore, 1) * 100; // Return as percentage
  }

  // Generate client-side fingerprinting script
  generateClientScript(): string {
    return `
(function() {
  function collectFingerprint() {
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language || navigator.userLanguage,
      platform: navigator.platform,
      screenResolution: screen.width + 'x' + screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorDepth: screen.colorDepth,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || 'unknown',
      plugins: Array.from(navigator.plugins).map(p => p.name),
    };

    // Canvas fingerprinting
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint canvas', 2, 2);
      fingerprint.canvas = canvas.toDataURL();
    } catch (e) {
      fingerprint.canvas = null;
    }

    // WebGL fingerprinting
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        fingerprint.webgl = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) {
      fingerprint.webgl = null;
    }

    return fingerprint;
  }

  // Make fingerprint available globally
  window.browserFingerprint = collectFingerprint();
})();
    `.trim();
  }
}

// Singleton instance
const fingerprintService = new FingerprintService();

export default fingerprintService;

// Helper function to create fingerprint from client data
export function createFingerprintFromClient(
  clientData: any
): BrowserFingerprint {
  return {
    userAgent: clientData.userAgent || "unknown",
    language: clientData.language || "unknown",
    platform: clientData.platform || "unknown",
    screenResolution: clientData.screenResolution || "unknown",
    timezone: clientData.timezone || "unknown",
    colorDepth: clientData.colorDepth || 0,
    cookieEnabled: clientData.cookieEnabled || false,
    doNotTrack: clientData.doNotTrack || "unknown",
    plugins: clientData.plugins || [],
    canvas: clientData.canvas || undefined,
    webgl: clientData.webgl || undefined,
  };
}

// Risk assessment thresholds
export const FINGERPRINT_RISK_THRESHOLDS = {
  LOW: 3,
  MEDIUM: 6,
  HIGH: 8,
};
