import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthed(req: NextRequest) {
  return req.headers.get("x-admin-secret") === process.env.ADMIN_SECRET;
}

// POST /api/admin/publish
// Body: { date, ageBand, pieceIds, force? }
// Refuses to overwrite an already-published grid unless force=true.
export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, ageBand, pieceIds, force } = await req.json() as {
    date: string;
    ageBand: string;
    pieceIds: string[];
    force?: boolean;
  };

  if (!date || !ageBand || !pieceIds?.length) {
    return NextResponse.json({ error: "date, ageBand, pieceIds required" }, { status: 400 });
  }

  const parsedDate = new Date(date);
  parsedDate.setHours(0, 0, 0, 0);

  // Guard: don't silently overwrite an existing published grid
  const existing = await prisma.dailyGrid.findUnique({
    where: { date_ageBand: { date: parsedDate, ageBand } },
  });
  if (existing?.publishedAt && !force) {
    return NextResponse.json(
      { error: "A grid for this date and age band is already published. Pass force=true to replace it.", existing },
      { status: 409 }
    );
  }

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

  // Mark pieces published, but preserve evergreen pieces' status so they stay in the library
  const evergreenIds = (
    await prisma.contentPiece.findMany({
      where: { id: { in: pieceIds }, evergreen: true },
      select: { id: true },
    })
  ).map((p) => p.id);

  const nonEvergreenIds = pieceIds.filter((id) => !evergreenIds.includes(id));

  if (nonEvergreenIds.length) {
    await prisma.contentPiece.updateMany({
      where: { id: { in: nonEvergreenIds } },
      data: { status: "published", publishDate: parsedDate },
    });
  }
  // Evergreen pieces just get their publishDate updated, status stays "approved" so they stay recyclable
  if (evergreenIds.length) {
    await prisma.contentPiece.updateMany({
      where: { id: { in: evergreenIds } },
      data: { publishDate: parsedDate },
    });
  }

  return NextResponse.json({ grid });
}
