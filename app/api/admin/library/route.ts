import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// GET: returns all evergreen pieces, optionally filtered by ageBand
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ageBand = searchParams.get("ageBand");

  const pieces = await prisma.contentPiece.findMany({
    where: {
      evergreen: true,
      ...(ageBand ? { ageBand } : {}),
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ pieces });
}
