import { NextRequest, NextResponse } from "next/server";
import { generateContentPiece, AgeBand, TopicCategory } from "@/lib/generate";
import { prisma } from "@/lib/prisma";

function isAuthed(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  return secret === process.env.ADMIN_SECRET;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const ageBand = body.ageBand as AgeBand;
  const topicCategory = body.topicCategory as TopicCategory;
  const publishDate = body.publishDate ? new Date(body.publishDate) : null;

  if (!ageBand || !topicCategory) {
    return NextResponse.json(
      { error: "ageBand and topicCategory are required" },
      { status: 400 }
    );
  }

  const generated = await generateContentPiece(ageBand, topicCategory);

  const piece = await prisma.contentPiece.create({
    data: {
      ageBand,
      topicCategory,
      publishDate,
      status: "draft",
      ...generated,
    },
  });

  return NextResponse.json({ piece });
}
