// app/api/admin/permissions/users/[userId]/route.ts
// GET  — returns a user's role, role perms, overrides, and effective permissions
// PUT  — saves per-user permission overrides

import { NextResponse } from "next/server";
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
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const overrideRows = await prisma.userPermissionOverride.findMany({
    where: { userId: user.id },
  });
  const overrides: Record<string, boolean> = {};
  for (const row of overrideRows) overrides[row.permission] = row.granted;

  const [rolePermissions, effectivePermissions] = await Promise.all([
    getRolePermissions(user.role as UserRole),
    getUserEffectivePermissions(user.id, user.role as UserRole),
  ]);

  return NextResponse.json({
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
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true, role: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { overrides } = body as { overrides: Array<{ permission: string; granted: boolean }> };

  if (!Array.isArray(overrides)) {
    return NextResponse.json({ error: "overrides must be an array" }, { status: 400 });
  }
  // Sanitise
  const safe = overrides.filter((o) =>
    (ALL_PERMISSIONS as readonly string[]).includes(o.permission) &&
    typeof o.granted === "boolean",
  );

  await setUserOverrides(user.id, safe);

  const effectivePermissions = await getUserEffectivePermissions(user.id, user.role as UserRole);
  return NextResponse.json({ success: true, userId: user.id, overrides: safe, effectivePermissions });
}
