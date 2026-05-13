import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const CreateAppointmentSchema = z.object({
  serviceId: z.string().cuid('Invalid service ID'),
  staffId: z.string().cuid('Invalid staff ID').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  notes: z.string().max(500).optional(),
  clientName: z.string().min(2).max(100).optional(),
  clientPhone: z.string().min(10).max(15).optional(),
  clientEmail: z.string().email().optional(),
});

describe('Appointment validation', () => {
  const validAppointment = {
    serviceId: 'clx1234567890abcdef',
    date: '2026-06-15',
    time: '10:30',
    notes: 'First visit',
  };

  it('accepts a valid appointment', () => {
    const result = CreateAppointmentSchema.safeParse(validAppointment);
    expect(result.success).toBe(true);
  });

  it('rejects invalid date format', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      date: '15-06-2026',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      time: '10:30 PM',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing serviceId', () => {
    const { serviceId, ...withoutService } = validAppointment;
    const result = CreateAppointmentSchema.safeParse(withoutService);
    expect(result.success).toBe(false);
  });

  it('rejects invalid serviceId (non-cuid)', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      serviceId: 'not-a-valid-cuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional staffId', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      staffId: 'clx9876543210abcdef',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional client info for guest booking', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      clientName: 'Test User',
      clientPhone: '+919876543210',
      clientEmail: 'test@example.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejects notes longer than 500 characters', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      notes: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = CreateAppointmentSchema.safeParse({
      ...validAppointment,
      clientEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });
});
