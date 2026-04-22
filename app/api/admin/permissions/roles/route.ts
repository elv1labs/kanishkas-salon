// app/api/admin/permissions/roles/route.ts
// GET  — returns all roles with their current permission lists
// PUT  — updates permissions for a specific role

import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import {
  ALL_PERMISSIONS,
  getAllRolePermissions,
  setRolePermissions,
} from "@/lib/permissions";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rolePermissions = await getAllRolePermissions();
  return NextResponse.json({ allPermissions: ALL_PERMISSIONS, rolePermissions });
}

export async function PUT(req: Request) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { role, permissions } = body as { role: UserRole; permissions: string[] };

  const validRoles: UserRole[] = ["ADMIN", "OWNER", "RECEPTIONIST", "CLIENT"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (!Array.isArray(permissions)) {
    return NextResponse.json({ error: "permissions must be an array" }, { status: 400 });
  }
  // Sanitise: only allow known permissions
  const safe = permissions.filter((p) => (ALL_PERMISSIONS as readonly string[]).includes(p));

  await setRolePermissions(role, safe);
  return NextResponse.json({ success: true, role, permissions: safe });
}
