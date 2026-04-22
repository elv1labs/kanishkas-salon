// tests/api/guest-booking-validation.test.ts
// Validates the GuestBookingSchema from the guest-book route
// Tests the validation logic without needing Prisma or auth

import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate the schema (since it's not exported)
const GuestBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  serviceId: z.string().min(1, "Service is required"),
  staffId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date format: YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time format: HH:mm"),
  notes: z.string().max(500).optional(),
});

describe('GuestBookingSchema', () => {
  const validPayload = {
    name: 'Rahul Sharma',
    phone: '9876543210',
    serviceId: 'svc_123',
    date: '2026-04-25',
    startTime: '10:00',
  };

  it('accepts valid minimal payload', () => {
    const result = GuestBookingSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('accepts valid full payload with optional fields', () => {
    const result = GuestBookingSchema.safeParse({
      ...validPayload,
      email: 'rahul@example.com',
      staffId: 'staff_456',
      notes: 'Please do not use gel',
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty email string', () => {
    const result = GuestBookingSchema.safeParse({ ...validPayload, email: '' });
    expect(result.success).toBe(true);
  });

  // Name validation
  it('rejects name shorter than 2 chars', () => {
    const result = GuestBookingSchema.safeParse({ ...validPayload, name: 'A' });
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = GuestBookingSchema.safeParse({ ...validPayload, name: '' });
    expect(result.success).toBe(false);
  });

  // Phone validation — Indian mobile numbers
  it('rejects phone starting with 0-5', () => {
    for (const prefix of ['0', '1', '2', '3', '4', '5']) {
      const result = GuestBookingSchema.safeParse({
        ...validPayload,
        phone: `${prefix}876543210`,
      });
      expect(result.success).toBe(false);
    }
  });

  it('accepts phone starting with 6-9', () => {
    for (const prefix of ['6', '7', '8', '9']) {
      const result = GuestBookingSchema.safeParse({
        ...validPayload,
        phone: `${prefix}123456789`,
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects phone with wrong length', () => {
    expect(GuestBookingSchema.safeParse({ ...validPayload, phone: '987654' }).success).toBe(false);
    expect(GuestBookingSchema.safeParse({ ...validPayload, phone: '98765432101' }).success).toBe(false);
  });

  it('rejects phone with letters', () => {
    const result = GuestBookingSchema.safeParse({ ...validPayload, phone: '9876abc210' });
    expect(result.success).toBe(false);
  });

  // Email validation
  it('rejects invalid email', () => {
    const result = GuestBookingSchema.safeParse({ ...validPayload, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  // Date validation
  it('rejects invalid date formats', () => {
    expect(GuestBookingSchema.safeParse({ ...validPayload, date: '25-04-2026' }).success).toBe(false);
    expect(GuestBookingSchema.safeParse({ ...validPayload, date: '2026/04/25' }).success).toBe(false);
    expect(GuestBookingSchema.safeParse({ ...validPayload, date: 'tomorrow' }).success).toBe(false);
  });

  // Time validation
  it('rejects invalid time formats', () => {
    expect(GuestBookingSchema.safeParse({ ...validPayload, startTime: '9:00' }).success).toBe(false);
    expect(GuestBookingSchema.safeParse({ ...validPayload, startTime: '10:00 AM' }).success).toBe(false);
  });

  it('accepts valid 24h time', () => {
    expect(GuestBookingSchema.safeParse({ ...validPayload, startTime: '14:30' }).success).toBe(true);
  });

  // Notes
  it('rejects notes over 500 chars', () => {
    const result = GuestBookingSchema.safeParse({
      ...validPayload,
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  // Missing required fields
  it('rejects missing serviceId', () => {
    const { serviceId, ...noService } = validPayload;
    expect(GuestBookingSchema.safeParse(noService).success).toBe(false);
  });

  it('rejects missing phone', () => {
    const { phone, ...noPhone } = validPayload;
    expect(GuestBookingSchema.safeParse(noPhone).success).toBe(false);
  });
});
