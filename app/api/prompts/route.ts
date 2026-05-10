import { NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const PATH = join(process.cwd(), "lib", "prompts.json");

export async function GET() {
  try {
    const data = readFileSync(PATH, "utf8");
    return new NextResponse(data, { headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json([], { status: 404 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    writeFileSync(PATH, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
