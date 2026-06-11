import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/schemas';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'secret123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret123' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('email');
  });

  it('rejects a password shorter than 6 chars', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'abc' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('password');
  });
});

describe('registerSchema', () => {
  const validPayload = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    phone: '+15550199',
  };

  it('rejects registration data without phone', () => {
    const rest = {
      name: validPayload.name,
      email: validPayload.email,
      password: validPayload.password,
    };
    expect(registerSchema.safeParse(rest).success).toBe(false);
  });

  it('accepts valid registration data with phone', () => {
    const result = registerSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 chars', () => {
    const result = registerSchema.safeParse({ ...validPayload, name: 'J' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain('name');
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({ ...validPayload, email: 'bad' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string for phone', () => {
    expect(registerSchema.safeParse({ ...validPayload, phone: '' }).success).toBe(false);
  });
});
