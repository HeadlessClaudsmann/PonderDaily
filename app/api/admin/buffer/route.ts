import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// Returns how many future days have a published grid, per age band
export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const grids = await prisma.dailyGrid.findMany({
    where: { date: { gte: today }, publishedAt: { not: null } },
    select: { ageBand: true, date: true },
    orderBy: { date: "asc" },
  });

  const bands = ["6-8", "9-12", "13-16"];
  const buffer: Record<string, number> = {};
  for (const band of bands) {
    buffer[band] = grids.filter((g) => g.ageBand === band).length;
  }

  return NextResponse.json({ buffer, grids });
}
