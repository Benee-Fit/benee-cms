import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * Generate a cryptographically secure token for share links
 * @returns A 64-character hexadecimal string
 */
export function generateUniqueToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hash a password using bcrypt with salt
 * @param password The plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against its hash
 * @param password The plain text password to verify
 * @param hash The hashed password to compare against
 * @returns Promise resolving to true if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if a share link is valid (not expired and active)
 * @param shareLink The share link object from database
 * @returns boolean indicating if the link is valid
 */
export function isShareLinkValid(shareLink: {
  isActive: boolean;
  expiresAt: Date | null;
}): boolean {
  if (!shareLink.isActive) {
    return false;
  }
  
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return false;
  }
  
  return true;
}

/**
 * Generate a secure password for share links
 * @param length The length of the password (default: 12)
 * @returns A random password string
 */
export function generateSecurePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}