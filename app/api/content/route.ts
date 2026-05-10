import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

function pathForDate(date: string) {
  // Sanitise: only allow YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Invalid date");
  return join(process.cwd(), "lib", "content", `${date}.json`);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? today();

  try {
    const filePath = pathForDate(date);
    if (!existsSync(filePath)) {
      return NextResponse.json({ error: "No content for this date" }, { status: 404 });
    }
    const data = readFileSync(filePath, "utf8");
    return new NextResponse(data, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? today();

  try {
    const filePath = pathForDate(date);
    const body = await req.json();
    if (typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
    }
    writeFileSync(filePath, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 });
  }
}
