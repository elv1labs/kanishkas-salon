// lib/constants.ts
// Shared application constants — single source of truth.
// Change values here only; never inline them in feature code.

// ── Loyalty Programme ─────────────────────────────────────────────────────────

/** Points required to earn ₹1 discount. 100 pts = ₹10. */
export const LOYALTY_POINTS_PER_RUPEE = 10; // 10 points = ₹1

/**
 * Rupee value of a single loyalty point.
 * discountAmount = pointsToRedeem * LOYALTY_POINT_VALUE_INR
 * e.g. 100 pts × 0.10 = ₹10
 */
export const LOYALTY_POINT_VALUE_INR = 0.10;

/**
 * Minimum points required to trigger a redemption.
 * Prevents trivial sub-₹1 redemptions.
 */
export const LOYALTY_MIN_REDEEM_POINTS = 10; // ₹1 minimum

// ── Salon Scheduling ─────────────────────────────────────────────────────────

/** Default business hours (used when BusinessSettings not yet saved). */
export const DEFAULT_OPEN_TIME  = "10:00";
export const DEFAULT_CLOSE_TIME = "21:00";
export const DEFAULT_SLOT_MINUTES = 30;

/**
 * Generate 30-minute time slot strings from open to close time.
 * e.g. generateTimeSlots("10:00", "21:00") → ["10:00", "10:30", ..., "20:30"]
 */
export function generateTimeSlots(openTime: string, closeTime: string, intervalMinutes = 30): string[] {
  const parseH = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const start = parseH(openTime);
  const end   = parseH(closeTime);
  const slots: string[] = [];
  for (let mins = start; mins < end; mins += intervalMinutes) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  return slots;
}

// ── Service & Product Categories ───────────────────────────────────────────────

export const SERVICE_CATEGORIES: Record<string, string> = {
  HAIR_STYLING:     "Hair Styling",
  HAIR_TREATMENTS:  "Hair Treatments",
  HAIR_COLORING:    "Hair Coloring",
  SKIN_CARE:        "Skin Care",
  MAKEUP:           "Makeup",
  NAIL_CARE:        "Nail Care",
  WAXING:           "Waxing",
  BODY_TREATMENTS:   "Body Treatments",
  HAND_FOOT_CARE:   "Hand & Foot Care",
  BRIDAL:           "Bridal",
  ACADEMY:          "Academy",
};

export const PRODUCT_CATEGORIES: Record<string, string> = {
  HAIR_CARE:         "Hair Care",
  MAKEUP_COSMETICS:  "Makeup",
  SKIN_CARE:         "Skin Care",
  NAIL_CARE:         "Nail Care",
  TOOLS_ACCESSORIES: "Tools",
  GIFT_VOUCHER:      "Gift Voucher",
  ACADEMY_ENROLLMENT: "Academy",
};

// ── Blog & Gallery Categories (must match Prisma enums) ──────────────────────

export const BLOG_CATEGORIES: string[] = [
  "Hair Care", "Skin Care", "Makeup", "Hair Treatments", "Nail Art",
  "Bridal", "Academy", "Tips & Tricks",
];

export const GALLERY_CATEGORIES: string[] = ["HAIR", "MAKEUP", "NAILS", "SKIN", "BRIDAL", "ACADEMY", "SALON_INTERIOR", "BEFORE_AFTER"];

export const GALLERY_CAT_COLORS: Record<string, string> = {
  HAIR:            "bg-purple-100 text-purple-700",
  MAKEUP:          "bg-gold/15 text-gold-dark",
  NAILS:           "bg-rose-100 text-rose-700",
  SKIN:            "bg-teal-100 text-teal-700",
  BRIDAL:          "bg-pink-100 text-pink-700",
  ACADEMY:         "bg-amber-100 text-amber-700",
  SALON_INTERIOR:  "bg-blue-100 text-blue-700",
  BEFORE_AFTER:    "bg-green-100 text-green-700",
};

// ── Loyalty Programme Tiers & Rates ────────────────────────────────────────────
// NOTE: earningRates should eventually come from DB LoyaltyRule table.

export const LOYALTY_TIERS = [
  { name: "BRONZE",   min: 0,    max: 499,   display: "Bronze",   icon: "🥉", perks: "1× points on all bookings",               color: "bg-amber-700/20 text-amber-700" },
  { name: "SILVER",   min: 500,  max: 1999,  display: "Silver",   icon: "🥈", perks: "1.5× points, priority booking",           color: "bg-gray-200 text-gray-600" },
  { name: "GOLD",     min: 2000, max: 4999,  display: "Gold",     icon: "🥇", perks: "2× points, free add-ons on each visit",   color: "bg-gold/20 text-gold-dark" },
  { name: "PLATINUM", min: 5000,  max: 99999, display: "Platinum", icon: "💎", perks: "3× points, VIP treatment, exclusive perks", color: "bg-purple-100 text-purple-700" },
];

export const LOYALTY_APPOINTMENT_EARN_RATE = 0.05;  // 5%
export const LOYALTY_PRODUCT_EARN_RATE    = 0.02;   // 2%
export const LOYALTY_REVIEW_BONUS         = 25;     // points per review
export const LOYALTY_REFERRAL_BONUS       = 200;    // points per referral