// app/api/admin/permissions/roles/route.ts
// GET  — returns all roles with their current permission lists
// PUT  — updates permissions for a specific role

import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";
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
  if (!session?.user) return apiUnauthorized();
  if (session.user.role !== "ADMIN") return apiForbidden();

  const rolePermissions = await getAllRolePermissions();
  return apiSuccess({ allPermissions: ALL_PERMISSIONS, rolePermissions });
}

export async function PUT(req: Request) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();
  if (session.user.role !== "ADMIN") return apiForbidden();

  const body = await req.json();
  const { role, permissions } = body as { role: UserRole; permissions: string[] };

  const validRoles: UserRole[] = ["ADMIN", "OWNER", "RECEPTIONIST", "CLIENT"];
  if (!validRoles.includes(role)) {
    return apiError("Invalid role");
  }
  if (!Array.isArray(permissions)) {
    return apiError("permissions must be an array");
  }
  // Sanitise: only allow known permissions
  const safe = permissions.filter((p) => (ALL_PERMISSIONS as readonly string[]).includes(p));

  await setRolePermissions(role, safe);
  return apiSuccess({ role, permissions: safe });
}
