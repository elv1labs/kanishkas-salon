// lib/permissions.ts
// Dynamic permission resolver with in-memory cache.
// Reads from RolePermission + UserPermissionOverride tables.
// hasPermission() in lib/auth.ts is kept unchanged as a static fallback.

import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

// ──────────────────────────────────────────────────────────────
// MASTER PERMISSION LIST
// Single source of truth for all permission strings in the system.
// ──────────────────────────────────────────────────────────────
export const ALL_PERMISSIONS = [
  // Admin-only
  "manageUsers",
  "manageSettings",
  // Admin + Owner
  "viewAnalytics",
  "manageProducts",
  "manageOrders",
  "manageServices",
  "manageContent",
  "manageAllAppointments",
  // Admin + Owner + Receptionist
  "manageAppointments",
  "manageClients",
  "viewClients",
  "manageBlog",
  "createBlog",
  "manageGallery",
  "createGallery",
  // Client-only
  "bookAppointments",
  "placeOrders",
  "viewOwnData",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

// ──────────────────────────────────────────────────────────────
// DEFAULT ROLE PERMISSIONS (used to seed DB if empty)
// Mirrors the static map in lib/auth.ts
// ──────────────────────────────────────────────────────────────
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // ADMIN gets every permission in the system
  ADMIN: [
    "manageUsers", "manageSettings", "viewAnalytics", "manageProducts",
    "manageOrders", "manageServices", "manageContent", "manageAllAppointments",
    "manageAppointments", "manageClients", "viewClients",
    "manageBlog", "createBlog", "manageGallery", "createGallery",
    "bookAppointments", "placeOrders", "viewOwnData",
  ],
  OWNER: [
    "viewAnalytics", "manageProducts", "manageOrders", "manageServices",
    "manageContent", "manageAllAppointments", "manageAppointments",
    "manageClients", "viewClients", "manageBlog", "createBlog",
    "manageGallery", "createGallery",
  ],
  RECEPTIONIST: [
    "manageAppointments", "manageClients", "viewClients", "manageOrders",
    "manageBlog", "createBlog", "manageGallery", "createGallery",
  ],
  CLIENT: ["bookAppointments", "placeOrders", "viewOwnData"],
};

// ──────────────────────────────────────────────────────────────
// IN-MEMORY CACHE
// Simple TTL-based module-level cache. Role permissions change
// very rarely, user overrides slightly more often.
// ──────────────────────────────────────────────────────────────
const ROLE_CACHE_TTL_MS  = 60_000; // 60 seconds
const USER_CACHE_TTL_MS  = 60_000;

interface CacheEntry<T> { value: T; expiresAt: number; }
const roleCache = new Map<UserRole, CacheEntry<string[]>>();
const userCache = new Map<string, CacheEntry<Record<string, boolean>>>();

export function invalidatePermissionCache(userId?: string) {
  if (userId) {
    userCache.delete(userId);
  } else {
    roleCache.clear();
    userCache.clear();
  }
}

// ──────────────────────────────────────────────────────────────
// ROLE PERMISSIONS
// Returns the persisted list for a role; seeds defaults if empty.
// ──────────────────────────────────────────────────────────────
export async function getRolePermissions(role: UserRole): Promise<string[]> {
  const cached = roleCache.get(role);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  let rows = await prisma.rolePermission.findMany({ where: { role } });

  // Auto-seed if the table has no entries for this role yet
  if (rows.length === 0) {
    const defaults = DEFAULT_ROLE_PERMISSIONS[role];
    await prisma.rolePermission.createMany({
      data: defaults.map((permission) => ({ role, permission })),
      skipDuplicates: true,
    });
    rows = await prisma.rolePermission.findMany({ where: { role } });
  }

  const perms = rows.map((r) => r.permission);
  roleCache.set(role, { value: perms, expiresAt: Date.now() + ROLE_CACHE_TTL_MS });
  return perms;
}

export async function setRolePermissions(role: UserRole, permissions: string[]): Promise<void> {
  // Delete all existing, then re-insert
  await prisma.rolePermission.deleteMany({ where: { role } });
  if (permissions.length > 0) {
    await prisma.rolePermission.createMany({
      data: permissions.map((permission) => ({ role, permission })),
      skipDuplicates: true,
    });
  }
  roleCache.delete(role); // invalidate cache for this role
}

// ──────────────────────────────────────────────────────────────
// USER OVERRIDES
// Returns a map of { [permission]: granted } for a user.
// ──────────────────────────────────────────────────────────────
async function getUserOverrides(userId: string): Promise<Record<string, boolean>> {
  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const rows = await prisma.userPermissionOverride.findMany({ where: { userId } });
  const overrides: Record<string, boolean> = {};
  for (const row of rows) overrides[row.permission] = row.granted;

  userCache.set(userId, { value: overrides, expiresAt: Date.now() + USER_CACHE_TTL_MS });
  return overrides;
}

export async function setUserOverrides(
  userId: string,
  overrides: Array<{ permission: string; granted: boolean }>,
): Promise<void> {
  // Upsert each override; delete any not in the new list
  await prisma.userPermissionOverride.deleteMany({ where: { userId } });
  if (overrides.length > 0) {
    await prisma.userPermissionOverride.createMany({
      data: overrides.map(({ permission, granted }) => ({ userId, permission, granted })),
      skipDuplicates: true,
    });
  }
  userCache.delete(userId);
}

// ──────────────────────────────────────────────────────────────
// EFFECTIVE PERMISSIONS
// Merges role permissions + user-level overrides.
// ──────────────────────────────────────────────────────────────
export async function getUserEffectivePermissions(
  userId: string,
  role: UserRole,
): Promise<string[]> {
  const [rolePerms, overrides] = await Promise.all([
    getRolePermissions(role),
    getUserOverrides(userId),
  ]);

  const effective = new Set(rolePerms);
  for (const [permission, granted] of Object.entries(overrides)) {
    if (granted) effective.add(permission);
    else effective.delete(permission);
  }
  return Array.from(effective);
}

// ──────────────────────────────────────────────────────────────
// ASYNC PERMISSION CHECK (DB-backed, cached)
// Drop-in async companion to hasPermission() in lib/auth.ts.
// ──────────────────────────────────────────────────────────────
export async function hasPermissionAsync(
  userId: string,
  role: UserRole,
  permission: string,
): Promise<boolean> {
  // ADMIN has ALL permissions — never deny an admin.
  if (role === "ADMIN") return true;
  const effective = await getUserEffectivePermissions(userId, role);
  return effective.includes(permission);
}

// ──────────────────────────────────────────────────────────────
// ALL ROLES SNAPSHOT (for admin UI)
// ──────────────────────────────────────────────────────────────
export async function getAllRolePermissions(): Promise<Record<UserRole, string[]>> {
  const roles: UserRole[] = ["ADMIN", "OWNER", "RECEPTIONIST", "CLIENT"];
  const entries = await Promise.all(
    roles.map(async (role) => [role, await getRolePermissions(role)] as const),
  );
  return Object.fromEntries(entries) as Record<UserRole, string[]>;
}
