import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile, mkdir } from "fs/promises";
import { join } from "path";

const STORE_PATH = join(process.cwd(), "lib", "gd-store.json");

// GET — return current store (used by live pages for polling)
export async function GET() {
  try {
    const content = await readFile(STORE_PATH, "utf-8");
    return new NextResponse(content, {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ layouts: [], todayId: null, palette: [] });
  }
}

// POST — write updated store from grid designer or live page
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    JSON.parse(body); // validate before writing
    await mkdir(join(process.cwd(), "lib"), { recursive: true });
    await writeFile(STORE_PATH, body, "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
