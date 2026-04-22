// app/api/staff/[id]/avatar/route.ts
// PATCH — update a staff member's portrait (avatarUrl in StaffProfile)

import { NextRequest } from "next/server";
import { apiSuccess, apiError, apiUnauthorized, apiForbidden } from "@/lib/api-utils";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return apiUnauthorized();
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return apiForbidden();
  }

  const body = await req.json().catch(() => null);
  const { avatarUrl } = body ?? {};

  if (!avatarUrl || typeof avatarUrl !== "string") {
    return apiError("avatarUrl is required");
  }

  await prisma.staffProfile.update({
    where: { userId: params.id },
    data: { avatarUrl },
  });

  return apiSuccess({ avatarUrl });
}
