/**
 * Input validation utilities for authentication
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    errors.push('Email is required');
    return { valid: false, errors };
  }

  // RFC 5322 simplified: local@domain.tld
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    errors.push('Email format is invalid');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate password against policy:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one digit');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate complete registration input
 */
export function validateRegistrationInput(input: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validate email
  const emailResult = validateEmail(input.email || '');
  errors.push(...emailResult.errors);

  // Validate password
  const passwordResult = validatePassword(input.password || '');
  errors.push(...passwordResult.errors);

  // Validate firstName
  if (!input.firstName || typeof input.firstName !== 'string' || input.firstName.trim().length === 0) {
    errors.push('First name is required');
  }

  // Validate lastName
  if (!input.lastName || typeof input.lastName !== 'string' || input.lastName.trim().length === 0) {
    errors.push('Last name is required');
  }

  return { valid: errors.length === 0, errors };
}
