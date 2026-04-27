import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// POST /api/admin/publish
// Body: { date: "YYYY-MM-DD", ageBand: "6-8"|"9-12"|"13-16", pieceIds: string[] }
// Creates or updates a DailyGrid for that date/band, marks pieces as published.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, ageBand, pieceIds } = await req.json() as {
    date: string;
    ageBand: string;
    pieceIds: string[];
  };

  if (!date || !ageBand || !pieceIds?.length) {
    return NextResponse.json({ error: "date, ageBand, pieceIds required" }, { status: 400 });
  }

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  const grid = await prisma.dailyGrid.upsert({
    where: { date_ageBand: { date: parsedDate, ageBand } },
    create: {
      date: parsedDate,
      ageBand,
      publishedAt: new Date(),
      pieces: { connect: pieceIds.map((id) => ({ id })) },
    },
    update: {
      publishedAt: new Date(),
      pieces: { set: pieceIds.map((id) => ({ id })) },
    },
  });

  await prisma.contentPiece.updateMany({
    where: { id: { in: pieceIds } },
    data: { status: "published", publishDate: parsedDate },
  });

  return NextResponse.json({ grid });
}
