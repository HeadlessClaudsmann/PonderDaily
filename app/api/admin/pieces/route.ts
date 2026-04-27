import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pieces = await prisma.contentPiece.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
  });

  return NextResponse.json({ pieces });
}
