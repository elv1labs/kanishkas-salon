import { describe, it, expect } from 'vitest';
import {
  LOYALTY_POINTS_PER_RUPEE,
  LOYALTY_POINT_VALUE_INR,
  LOYALTY_MIN_REDEEM_POINTS,
  LOYALTY_APPOINTMENT_EARN_RATE,
  LOYALTY_PRODUCT_EARN_RATE,
  LOYALTY_REVIEW_BONUS,
  LOYALTY_REFERRAL_BONUS,
  DEFAULT_OPEN_TIME,
  DEFAULT_CLOSE_TIME,
  DEFAULT_SLOT_MINUTES,
  generateTimeSlots,
  SERVICE_CATEGORIES,
  PRODUCT_CATEGORIES,
  BLOG_CATEGORIES,
  GALLERY_CATEGORIES,
  GALLERY_CAT_COLORS,
  LOYALTY_TIERS,
} from '@/lib/constants';

describe('Loyalty constants', () => {
  it('LOYALTY_POINTS_PER_RUPEE is 10', () => {
    expect(LOYALTY_POINTS_PER_RUPEE).toBe(10);
  });

  it('LOYALTY_POINT_VALUE_INR is 0.10', () => {
    expect(LOYALTY_POINT_VALUE_INR).toBe(0.10);
  });

  it('LOYALTY_MIN_REDEEM_POINTS is 10', () => {
    expect(LOYALTY_MIN_REDEEM_POINTS).toBe(10);
  });

  it('points per rupee * point value = 1', () => {
    expect(LOYALTY_POINTS_PER_RUPEE * LOYALTY_POINT_VALUE_INR).toBe(1);
  });

  it('LOYALTY_APPOINTMENT_EARN_RATE is 5%', () => {
    expect(LOYALTY_APPOINTMENT_EARN_RATE).toBe(0.05);
  });

  it('LOYALTY_PRODUCT_EARN_RATE is 2%', () => {
    expect(LOYALTY_PRODUCT_EARN_RATE).toBe(0.02);
  });

  it('LOYALTY_REVIEW_BONUS is 25 points', () => {
    expect(LOYALTY_REVIEW_BONUS).toBe(25);
  });

  it('LOYALTY_REFERRAL_BONUS is 200 points', () => {
    expect(LOYALTY_REFERRAL_BONUS).toBe(200);
  });
});

describe('Scheduling constants', () => {
  it('DEFAULT_OPEN_TIME is 10:00', () => {
    expect(DEFAULT_OPEN_TIME).toBe('10:00');
  });

  it('DEFAULT_CLOSE_TIME is 21:00', () => {
    expect(DEFAULT_CLOSE_TIME).toBe('21:00');
  });

  it('DEFAULT_SLOT_MINUTES is 30', () => {
    expect(DEFAULT_SLOT_MINUTES).toBe(30);
  });
});

describe('generateTimeSlots', () => {
  it('generates 30-min slots from open to close', () => {
    const slots = generateTimeSlots('10:00', '21:00');
    expect(slots).toContain('10:00');
    expect(slots).toContain('10:30');
    expect(slots).toContain('20:30');
    expect(slots).not.toContain('21:00');
  });

  it('count is correct for full day', () => {
    const slots = generateTimeSlots('10:00', '21:00');
    expect(slots.length).toBe(22); // 11 hours × 2 slots/hour
  });

  it('generates slots with custom interval', () => {
    const slots = generateTimeSlots('09:00', '12:00', 60);
    expect(slots).toEqual(['09:00', '10:00', '11:00']);
  });

  it('returns empty array when open equals close', () => {
    const slots = generateTimeSlots('10:00', '10:00');
    expect(slots).toEqual([]);
  });

  it('returns empty array when open after close', () => {
    const slots = generateTimeSlots('21:00', '10:00');
    expect(slots).toEqual([]);
  });

  it('handles single-hour windows', () => {
    const slots = generateTimeSlots('14:00', '15:00');
    expect(slots).toEqual(['14:00', '14:30']);
  });

  it('pads single-digit hours', () => {
    const slots = generateTimeSlots('09:00', '10:00');
    expect(slots[0]).toBe('09:00');
    expect(slots[1]).toBe('09:30');
  });

  it('works with midnight crossover', () => {
    const slots = generateTimeSlots('22:00', '23:00', 30);
    expect(slots).toEqual(['22:00', '22:30']);
  });
});

describe('SERVICE_CATEGORIES', () => {
  it('contains expected categories', () => {
    const keys = Object.keys(SERVICE_CATEGORIES);
    expect(keys).toContain('HAIR_STYLING');
    expect(keys).toContain('BRIDAL');
    expect(keys).toContain('ACADEMY');
  });

  it('has 11 categories', () => {
    expect(Object.keys(SERVICE_CATEGORIES).length).toBe(11);
  });
});

describe('PRODUCT_CATEGORIES', () => {
  it('contains HAIR_CARE and GIFT_VOUCHER', () => {
    expect(PRODUCT_CATEGORIES.HAIR_CARE).toBe('Hair Care');
    expect(PRODUCT_CATEGORIES.GIFT_VOUCHER).toBe('Gift Voucher');
  });

  it('has 7 categories', () => {
    expect(Object.keys(PRODUCT_CATEGORIES).length).toBe(7);
  });
});

describe('BLOG_CATEGORIES', () => {
  it('contains 8 entries', () => {
    expect(BLOG_CATEGORIES.length).toBe(8);
  });

  it('includes all expected categories', () => {
    expect(BLOG_CATEGORIES).toContain('Hair Care');
    expect(BLOG_CATEGORIES).toContain('Tips & Tricks');
  });
});

describe('GALLERY_CATEGORIES', () => {
  it('contains 8 entries', () => {
    expect(GALLERY_CATEGORIES.length).toBe(8);
  });

  it('includes BEFORE_AFTER', () => {
    expect(GALLERY_CATEGORIES).toContain('BEFORE_AFTER');
  });
});

describe('GALLERY_CAT_COLORS', () => {
  it('has color for every category', () => {
    for (const cat of GALLERY_CATEGORIES) {
      expect(GALLERY_CAT_COLORS[cat]).toBeDefined();
    }
  });

  it('each color string contains bg- and text-', () => {
    for (const color of Object.values(GALLERY_CAT_COLORS)) {
      expect(color).toMatch(/^bg-/);
      expect(color).toContain(' text-');
    }
  });
});

describe('LOYALTY_TIERS', () => {
  it('has 4 tiers in descending order', () => {
    expect(LOYALTY_TIERS[0].name).toBe('BRONZE');
    expect(LOYALTY_TIERS[1].name).toBe('SILVER');
    expect(LOYALTY_TIERS[2].name).toBe('GOLD');
    expect(LOYALTY_TIERS[3].name).toBe('PLATINUM');
  });

  it('tier thresholds increase correctly', () => {
    for (let i = 1; i < LOYALTY_TIERS.length; i++) {
      expect(LOYALTY_TIERS[i].min).toBeGreaterThan(LOYALTY_TIERS[i - 1].max);
    }
  });

  it('each tier has required fields', () => {
    for (const tier of LOYALTY_TIERS) {
      expect(tier.display).toBeDefined();
      expect(tier.perks).toBeDefined();
      expect(tier.color).toMatch(/^bg-/);
    }
  });
});
