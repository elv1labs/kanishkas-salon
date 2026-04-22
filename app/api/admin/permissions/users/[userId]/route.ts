// app/api/admin/permissions/users/[userId]/route.ts
// GET  — returns a user's role, role perms, overrides, and effective permissions
// PUT  — saves per-user permission overrides

import { apiSuccess, apiError, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/api-utils";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ALL_PERMISSIONS,
  getRolePermissions,
  getUserEffectivePermissions,
  setUserOverrides,
} from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { userId: string } },
) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();
  if (session.user.role !== "ADMIN") return apiForbidden();

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user) return apiNotFound("User not found");

  const overrideRows = await prisma.userPermissionOverride.findMany({
    where: { userId: user.id },
  });
  const overrides: Record<string, boolean> = {};
  for (const row of overrideRows) overrides[row.permission] = row.granted;

  const [rolePermissions, effectivePermissions] = await Promise.all([
    getRolePermissions(user.role as UserRole),
    getUserEffectivePermissions(user.id, user.role as UserRole),
  ]);

  return apiSuccess({
    user,
    allPermissions: ALL_PERMISSIONS,
    rolePermissions,
    overrides,
    effectivePermissions,
  });
}

export async function PUT(
  req: Request,
  { params }: { params: { userId: string } },
) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();
  if (session.user.role !== "ADMIN") return apiForbidden();

  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true, role: true } });
  if (!user) return apiNotFound("User not found");

  const body = await req.json();
  const { overrides } = body as { overrides: Array<{ permission: string; granted: boolean }> };

  if (!Array.isArray(overrides)) {
    return apiError("overrides must be an array");
  }
  // Sanitise
  const safe = overrides.filter((o) =>
    (ALL_PERMISSIONS as readonly string[]).includes(o.permission) &&
    typeof o.granted === "boolean",
  );

  await setUserOverrides(user.id, safe);

  const effectivePermissions = await getUserEffectivePermissions(user.id, user.role as UserRole);
  return apiSuccess({ userId: user.id, overrides: safe, effectivePermissions });
}
