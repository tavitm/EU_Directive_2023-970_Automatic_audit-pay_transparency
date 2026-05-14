import crypto from 'crypto';

const PSEUDONYMIZATION_SALT = process.env.PSEUDONYMIZATION_SALT || 'directive-2023-970-salt';

/**
 * Generate irreversible pseudonym hash using SHA-256
 * Used for employee identification without revealing original ID
 * GDPR Article 4(11) - Pseudonymisation
 */
export function generatePseudonymHash(employeeId: string): string {
  return crypto
    .createHash('sha256')
    .update(employeeId + PSEUDONYMIZATION_SALT)
    .digest('hex');
}

/**
 * Verify that a given ID produces the expected hash
 * Used for matching pseudonymized records with original IDs during import
 */
export function verifyPseudonymHash(employeeId: string, hash: string): boolean {
  const calculatedHash = generatePseudonymHash(employeeId);
  return calculatedHash === hash;
}

/**
 * Generate a unique pseudonym for a user in a specific context
 * Different salts can be used for different contexts to prevent linking
 */
export function generateContextualPseudonym(
  employeeId: string,
  context: string
): string {
  const contextSalt = crypto
    .createHash('sha256')
    .update(PSEUDONYMIZATION_SALT + context)
    .digest('hex');

  return crypto
    .createHash('sha256')
    .update(employeeId + contextSalt)
    .digest('hex');
}

/**
 * Hash sensitive salary data for storage
 * Combined with encryption for defense in depth
 */
export function hashSalaryData(salary: number, employeeId: string): string {
  return crypto
    .createHash('sha256')
    .update(salary.toString() + employeeId + PSEUDONYMIZATION_SALT)
    .digest('hex');
}

/**
 * Create audit trail entry pseudonym
 * Links actions to pseudonymized users without identifying them
 */
export function generateAuditPseudonym(userId: string): string {
  return crypto
    .createHash('sha256')
    .update('audit:' + userId + PSEUDONYMIZATION_SALT)
    .digest('hex');
}

export interface PseudonymizationReport {
  originalRecords: number;
  successfullyPseudonymized: number;
  failedRecords: number;
  deletedFields: {
    firstNames: number;
    lastNames: number;
    originalIds: number;
  };
  timestamp: Date;
  algorithm: string;
  salt: string; // Hash of salt, not the actual salt
}

export function createPseudonymizationReport(
  totalRecords: number,
  successful: number,
  failed: number
): PseudonymizationReport {
  return {
    originalRecords: totalRecords,
    successfullyPseudonymized: successful,
    failedRecords: failed,
    deletedFields: {
      firstNames: successful,
      lastNames: successful,
      originalIds: successful,
    },
    timestamp: new Date(),
    algorithm: 'SHA-256',
    salt: crypto.createHash('sha256').update(PSEUDONYMIZATION_SALT).digest('hex'),
  };
}
