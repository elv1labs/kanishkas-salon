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
