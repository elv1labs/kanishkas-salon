// tests/setup.ts
// Global test setup — mock environment variables and Prisma client.

import { vi } from 'vitest';

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.NEXT_PUBLIC_SALON_NAME = "Kanishka's Family Salon";
process.env.NEXT_PUBLIC_SALON_PHONE = '+919171230292';
process.env.CRON_SECRET = 'test-cron-secret';
