import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateRegistrationInput } from './validators';

describe('validateEmail', () => {
  it('should accept valid email addresses', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
    expect(validateEmail('test.user@domain.org').valid).toBe(true);
    expect(validateEmail('user+tag@company.io').valid).toBe(true);
    expect(validateEmail('admin@octocat.com').valid).toBe(true);
  });

  it('should reject empty or missing email', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should reject null/undefined email', () => {
    const result = validateEmail(undefined as unknown as string);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should reject email without @', () => {
    const result = validateEmail('userexample.com');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email format is invalid');
  });

  it('should reject email without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email format is invalid');
  });

  it('should reject email without TLD', () => {
    const result = validateEmail('user@domain');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email format is invalid');
  });

  it('should reject whitespace-only email', () => {
    const result = validateEmail('   ');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });
});

describe('validatePassword', () => {
  it('should accept a valid password meeting all criteria', () => {
    const result = validatePassword('OctoCAT2024!@');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('should reject null/undefined password', () => {
    const result = validatePassword(undefined as unknown as string);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password is required');
  });

  it('should reject password shorter than 12 characters', () => {
    const result = validatePassword('Short1!abc');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 12 characters long');
  });

  it('should reject password without uppercase letter', () => {
    const result = validatePassword('alllowercase1!@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one uppercase letter');
  });

  it('should reject password without lowercase letter', () => {
    const result = validatePassword('ALLUPPERCASE1!@');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one lowercase letter');
  });

  it('should reject password without digit', () => {
    const result = validatePassword('NoDigitsHere!@ab');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one digit');
  });

  it('should reject password without special character', () => {
    const result = validatePassword('NoSpecial12345A');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must contain at least one special character');
  });

  it('should return multiple errors for multiple violations', () => {
    const result = validatePassword('short');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe('validateRegistrationInput', () => {
  const validInput = {
    email: 'test@example.com',
    password: 'OctoCAT2024!@',
    firstName: 'John',
    lastName: 'Doe',
  };

  it('should accept valid registration input', () => {
    const result = validateRegistrationInput(validInput);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject missing email', () => {
    const result = validateRegistrationInput({ ...validInput, email: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email is required');
  });

  it('should reject invalid email format', () => {
    const result = validateRegistrationInput({ ...validInput, email: 'notanemail' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Email format is invalid');
  });

  it('should reject weak password', () => {
    const result = validateRegistrationInput({ ...validInput, password: 'weak' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Password'))).toBe(true);
  });

  it('should reject missing firstName', () => {
    const result = validateRegistrationInput({ ...validInput, firstName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('First name is required');
  });

  it('should reject missing lastName', () => {
    const result = validateRegistrationInput({ ...validInput, lastName: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Last name is required');
  });

  it('should reject whitespace-only names', () => {
    const result = validateRegistrationInput({ ...validInput, firstName: '   ', lastName: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('First name is required');
    expect(result.errors).toContain('Last name is required');
  });

  it('should return all errors for completely invalid input', () => {
    const result = validateRegistrationInput({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });
});
