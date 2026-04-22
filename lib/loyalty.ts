// lib/loyalty.ts
// Loyalty programme automation engine.
// Handles point awarding for appointments, purchases, and reviews,
// plus automatic tier upgrades.

import { prisma } from "./prisma";
import { LoyaltyTransactionType } from "@prisma/client";

// ── Tier thresholds ──────────────────────────────────────────────────────────
const TIER_THRESHOLDS = [
  { tier: "PLATINUM", minPoints: 5000 },
  { tier: "GOLD",     minPoints: 2000 },
  { tier: "SILVER",   minPoints: 500 },
  { tier: "BRONZE",   minPoints: 0 },
] as const;

// ── Core: get or create loyalty account ──────────────────────────────────────
async function getOrCreateAccount(userId: string) {
  return prisma.loyaltyAccount.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });
}

// ── Award points (generic) ───────────────────────────────────────────────────
async function awardPoints(opts: {
  userId: string;
  type: LoyaltyTransactionType;
  points: number;
  description: string;
  appointmentId?: string;
  orderId?: string;
}) {
  if (opts.points <= 0) return null;

  const account = await getOrCreateAccount(opts.userId);

  const [tx] = await prisma.$transaction([
    prisma.loyaltyTransaction.create({
      data: {
        loyaltyAccountId: account.id,
        type: opts.type,
        points: opts.points,
        description: opts.description,
        status: "APPROVED",
        appointmentId: opts.appointmentId ?? null,
        orderId: opts.orderId ?? null,
      },
    }),
    prisma.loyaltyAccount.update({
      where: { id: account.id },
      data: {
        totalPoints: { increment: opts.points },
        lifetimeEarned: { increment: opts.points },
      },
    }),
  ]);

  // Check tier upgrade after awarding
  await checkTierUpgrade(account.id);

  return tx;
}

// ── Award points for completed appointment ───────────────────────────────────
export async function awardLoyaltyPoints(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { name: true, price: true } },
      client: { select: { id: true } },
    },
  });

  if (!appointment || !appointment.client) return null;

  // Check if points were already awarded for this appointment
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: {
      appointmentId,
      type: "EARN_APPOINTMENT",
    },
  });
  if (existing) return null; // Already awarded

  // Find active EARN_APPOINTMENT rule
  const rule = await prisma.loyaltyRule.findFirst({
    where: { type: "EARN_APPOINTMENT", isActive: true },
  });

  if (!rule) return null; // No active rule

  // Calculate points
  const servicePrice = Number(appointment.service.price);
  let points = 0;

  if (rule.fixedPoints) {
    points = rule.fixedPoints;
  } else if (rule.pointsPerRupee) {
    points = Math.floor(servicePrice * Number(rule.pointsPerRupee));
  }

  if (points <= 0) return null;

  return awardPoints({
    userId: appointment.client.id,
    type: "EARN_APPOINTMENT",
    points,
    description: `Earned ${points} pts for ${appointment.service.name} (₹${servicePrice})`,
    appointmentId,
  });
}

// ── Award points for completed order ─────────────────────────────────────────
export async function awardPurchasePoints(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, clientId: true, total: true, orderRef: true },
  });

  if (!order) return null;

  // Check if points were already awarded for this order
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: {
      orderId,
      type: "EARN_PURCHASE",
    },
  });
  if (existing) return null;

  // Find active EARN_PURCHASE rule
  const rule = await prisma.loyaltyRule.findFirst({
    where: { type: "EARN_PURCHASE", isActive: true },
  });

  if (!rule) return null;

  const orderTotal = Number(order.total);

  // Check minimum spend
  if (rule.minSpend && orderTotal < Number(rule.minSpend)) return null;

  let points = 0;
  if (rule.fixedPoints) {
    points = rule.fixedPoints;
  } else if (rule.pointsPerRupee) {
    points = Math.floor(orderTotal * Number(rule.pointsPerRupee));
  }

  if (points <= 0) return null;

  return awardPoints({
    userId: order.clientId,
    type: "EARN_PURCHASE",
    points,
    description: `Earned ${points} pts for order #${order.orderRef.slice(-8).toUpperCase()} (₹${orderTotal})`,
    orderId,
  });
}

// ── Award points for approved review ─────────────────────────────────────────
export async function awardReviewPoints(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, clientId: true },
  });

  if (!review) return null;

  // Check if review points were already awarded for this user recently
  // (one review point per approved review)
  const existing = await prisma.loyaltyTransaction.findFirst({
    where: {
      loyaltyAccount: { userId: review.clientId },
      type: "EARN_REVIEW",
      description: { contains: reviewId },
    },
  });
  if (existing) return null;

  // Find active EARN_REVIEW rule
  const rule = await prisma.loyaltyRule.findFirst({
    where: { type: "EARN_REVIEW", isActive: true },
  });

  if (!rule) return null;

  const points = rule.fixedPoints ?? 10; // Default 10 pts per review

  return awardPoints({
    userId: review.clientId,
    type: "EARN_REVIEW",
    points,
    description: `Earned ${points} pts for approved review (${reviewId.slice(-6)})`,
  });
}

// ── Check and apply tier upgrade ─────────────────────────────────────────────
export async function checkTierUpgrade(loyaltyAccountId: string) {
  const account = await prisma.loyaltyAccount.findUnique({
    where: { id: loyaltyAccountId },
    select: { id: true, userId: true, lifetimeEarned: true, tier: true },
  });

  if (!account) return;

  // Determine the correct tier based on lifetime points
  let newTier = "BRONZE";
  for (const { tier, minPoints } of TIER_THRESHOLDS) {
    if (account.lifetimeEarned >= minPoints) {
      newTier = tier;
      break;
    }
  }

  // Only upgrade, never downgrade automatically
  const currentTierIndex = TIER_THRESHOLDS.findIndex((t) => t.tier === account.tier);
  const newTierIndex = TIER_THRESHOLDS.findIndex((t) => t.tier === newTier);

  if (newTierIndex < currentTierIndex) {
    // newTierIndex < currentTierIndex means upgrade (PLATINUM=0 is highest)
    await prisma.loyaltyAccount.update({
      where: { id: loyaltyAccountId },
      data: { tier: newTier, tierUpdatedAt: new Date() },
    });

    // Notify user about tier upgrade
    await prisma.notification.create({
      data: {
        userId: account.userId,
        type: "LOYALTY_POINTS",
        title: `🎉 Congratulations! You're now ${newTier}!`,
        message: `You've been upgraded to ${newTier} tier with ${account.lifetimeEarned} lifetime points. Enjoy your new benefits!`,
        actionUrl: "/dashboard/client/loyalty",
      },
    });
  }
}
