/**
 * Utility functions for validating various types of data
 */

/**
 * Validates an Aadhaar number
 * - Must be exactly 12 digits
 * - First digit cannot be 0 or 1
 * - Only numeric characters [0-9]
 */
export function validateAadhaar(aadhaar: string): boolean {
  // Remove any spaces or special characters
  const cleanedAadhaar = aadhaar.replace(/[^0-9]/g, "");

  // Check if it's exactly 12 digits
  if (cleanedAadhaar.length !== 12) {
    return false;
  }

  // Check if the first digit is not 0 or 1
  if (cleanedAadhaar.charAt(0) === "0" || cleanedAadhaar.charAt(0) === "1") {
    return false;
  }

  // Check if it contains only numeric characters
  return /^\d+$/.test(cleanedAadhaar);
}

/**
 * Validates a PAN (Permanent Account Number)
 * - Format: AAAAA9999A (10 characters total)
 * - First 5 characters – uppercase letters (A–Z)
 * - Next 4 characters – digits (0–9)
 * - Last character – uppercase letter (A–Z)
 */
export function validatePAN(pan: string): boolean {
  // Remove any spaces or special characters
  const cleanedPAN = pan.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  // Check if it's exactly 10 characters
  if (cleanedPAN.length !== 10) {
    return false;
  }

  // Check the format: first 5 chars are letters, next 4 are digits, last is a letter
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanedPAN);
}

/**
 * Formats an Aadhaar number with spaces for better readability
 * Example: 123456789012 -> 1234 5678 9012
 */
export function formatAadhaar(aadhaar: string): string {
  const cleanedAadhaar = aadhaar.replace(/[^0-9]/g, "");
  if (cleanedAadhaar.length !== 12) return cleanedAadhaar;

  return cleanedAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
}

/**
 * Formats a PAN number for better readability
 * Example: ABCDE1234F -> ABCDE 1234 F
 */
export function formatPAN(pan: string): string {
  const cleanedPAN = pan.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (cleanedPAN.length !== 10) return cleanedPAN;

  return cleanedPAN.replace(/([A-Z]{5})(\d{4})([A-Z]{1})/, "$1 $2 $3");
}
