// app/api/staff/[id]/avatar/route.ts
// PATCH — update a staff member's portrait (avatarUrl in StaffProfile)

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAuthSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["ADMIN", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const { avatarUrl } = body ?? {};

  if (!avatarUrl || typeof avatarUrl !== "string") {
    return NextResponse.json({ error: "avatarUrl is required" }, { status: 400 });
  }

  await prisma.staffProfile.update({
    where: { userId: params.id },
    data: { avatarUrl },
  });

  return NextResponse.json({ success: true, avatarUrl });
}
