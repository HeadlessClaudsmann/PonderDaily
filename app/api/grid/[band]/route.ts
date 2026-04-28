import { NextRequest, NextResponse } from "next/server";
import { getGrid, AgeBand } from "@/lib/grid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ band: string }> }
) {
  const { band } = await params;
  const valid = ["6-8", "9-12", "13-16"];
  if (!valid.includes(band)) {
    return NextResponse.json({ error: "Invalid band" }, { status: 400 });
  }

  const grid = await getGrid(band as AgeBand);
  return NextResponse.json({ pieces: grid?.pieces ?? [] });
}
