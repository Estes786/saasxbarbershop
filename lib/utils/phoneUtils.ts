/**
 * 📱 Phone Number Utility Functions
 * Centralized phone normalization for consistent data format
 */

/**
 * Normalize phone number to consistent format (08xxx)
 * Handles various input formats:
 * - +628123456789 => 08123456789
 * - 628123456789 => 08123456789
 * - 08123456789 => 08123456789
 * - 8123456789 => 08123456789
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle +62 prefix (international format)
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  }
  
  // Ensure starts with 0
  if (!cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }
  
  console.log(`📞 Phone normalization: "${phone}" => "${cleaned}"`);
  return cleaned;
}

/**
 * Generate all possible phone number variants for database queries
 * Returns array of different formats to maximize match probability
 */
export function getPhoneVariants(phone: string): string[] {
  const normalized = normalizePhoneNumber(phone);
  
  if (!normalized) return [];
  
  const variants: string[] = [
    phone,                                    // Original format
    normalized,                               // Normalized (08xxx)
    '+62' + normalized.substring(1),         // International (+62xxx)
    '62' + normalized.substring(1),          // Without plus (62xxx)
  ];
  
  // Remove duplicates
  return Array.from(new Set(variants));
}

/**
 * Format phone number for display (readable format)
 * Example: 08123456789 => 0812-3456-789
 */
export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  
  if (!normalized || normalized.length < 10) return phone;
  
  // Format: 0812-3456-789
  return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}-${normalized.slice(8)}`;
}

/**
 * Validate Indonesian phone number format
 */
export function isValidIndonesianPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  
  // Indonesian mobile numbers: 08xx-xxxx-xxxx (10-13 digits)
  const phoneRegex = /^08\d{8,11}$/;
  
  return phoneRegex.test(normalized);
}
