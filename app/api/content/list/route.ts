import { NextResponse } from "next/server";
import { readdirSync, existsSync } from "fs";
import { join } from "path";

const DIR = join(process.cwd(), "lib", "content");

export async function GET() {
  try {
    if (!existsSync(DIR)) return NextResponse.json([]);
    const dates = readdirSync(DIR)
      .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map(f => f.replace(".json", ""))
      .sort()
      .reverse(); // newest first
    return NextResponse.json(dates);
  } catch {
    return NextResponse.json([]);
  }
}
