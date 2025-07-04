import rateLimiter from "./rate-limit";

// Emergency IP blocking for localhost attacks
const EMERGENCY_BLOCKED_IPS = new Set<string>();

// Immediately block localhost if it's causing issues
export function emergencyBlockLocalhost(): void {
  const localhostIPs = ["127.0.0.1", "::1", "localhost"];

  localhostIPs.forEach((ip) => {
    EMERGENCY_BLOCKED_IPS.add(ip);
    rateLimiter.blockIP(
      ip,
      "EMERGENCY: Automated attack detected from localhost",
      24 * 60 * 60 * 1000
    ); // 24 hours
    console.error(
      `[EMERGENCY BLOCK] ${ip} has been immediately blocked due to automated attack`
    );
  });
}

// Check if IP is emergency blocked
export function isEmergencyBlocked(ip: string): boolean {
  return EMERGENCY_BLOCKED_IPS.has(ip);
}

// Remove emergency block
export function removeEmergencyBlock(ip: string): void {
  EMERGENCY_BLOCKED_IPS.delete(ip);
  rateLimiter.unblockIP(ip);
  console.log(`[EMERGENCY] Removed emergency block for ${ip}`);
}

// Get emergency blocked IPs
export function getEmergencyBlockedIPs(): string[] {
  return Array.from(EMERGENCY_BLOCKED_IPS);
}

// Auto-detect and block rapid attacks
export function detectAndBlockRapidAttacks(): void {
  // This would typically analyze logs or metrics
  // For now, we'll block localhost as it's the source of the attack
  console.log("[EMERGENCY] Detecting rapid attacks...");

  // Check if localhost is making too many requests
  const localhostStats = rateLimiter.getStats("::1", "ip");
  if (localhostStats && localhostStats.count > 10) {
    console.error(
      "[EMERGENCY] Localhost attack detected, implementing emergency block"
    );
    emergencyBlockLocalhost();
  }
}

// Initialize emergency security measures
export function initializeEmergencySecurity(): void {
  console.log("[EMERGENCY SECURITY] Initializing emergency security measures");

  // Immediately block localhost due to ongoing attack
  emergencyBlockLocalhost();

  // Set up monitoring interval
  const monitoringInterval = setInterval(() => {
    detectAndBlockRapidAttacks();
  }, 30000); // Check every 30 seconds

  // Clean up after 1 hour
  setTimeout(() => {
    clearInterval(monitoringInterval);
    console.log("[EMERGENCY SECURITY] Emergency monitoring period ended");
  }, 60 * 60 * 1000);
}
