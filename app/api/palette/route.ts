import { NextRequest, NextResponse } from "next/server";

// Simple k-means colour quantisation on image pixel data.
// Expects a multipart/form-data POST with an `image` field.

type RGB = [number, number, number];

function rgbToHex([r, g, b]: RGB) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

function distance(a: RGB, b: RGB) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function kMeans(pixels: RGB[], k: number, iterations = 12): RGB[] {
  // Seed centroids spread across the array
  const centroids: RGB[] = Array.from({ length: k }, (_, i) =>
    [...pixels[Math.floor((i * pixels.length) / k)]] as RGB
  );

  let assignments = new Int32Array(pixels.length);

  for (let iter = 0; iter < iterations; iter++) {
    // Assign
    for (let pi = 0; pi < pixels.length; pi++) {
      let best = 0;
      let bestDist = Infinity;
      for (let ci = 0; ci < k; ci++) {
        const d = distance(pixels[pi], centroids[ci]);
        if (d < bestDist) {
          bestDist = d;
          best = ci;
        }
      }
      assignments[pi] = best;
    }

    // Update centroids
    const sums: [number, number, number, number][] = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let pi = 0; pi < pixels.length; pi++) {
      const ci = assignments[pi];
      sums[ci][0] += pixels[pi][0];
      sums[ci][1] += pixels[pi][1];
      sums[ci][2] += pixels[pi][2];
      sums[ci][3] += 1;
    }
    for (let ci = 0; ci < k; ci++) {
      const n = sums[ci][3] || 1;
      centroids[ci] = [
        clamp(Math.round(sums[ci][0] / n), 0, 255),
        clamp(Math.round(sums[ci][1] / n), 0, 255),
        clamp(Math.round(sums[ci][2] / n), 0, 255),
      ];
    }
  }

  // Sort by cluster size (most common first)
  const counts = new Int32Array(k);
  for (const ci of assignments) counts[ci]++;
  const sorted = Array.from({ length: k }, (_, i) => i).sort(
    (a, b) => counts[b] - counts[a]
  );

  return sorted.map((ci) => centroids[ci]);
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "no image" }, { status: 400 });

  const arrayBuffer = await file.arrayBuffer();

  // Decode image with sharp if available, else fall back to raw decoding
  let pixels: RGB[] = [];
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(Buffer.from(arrayBuffer))
      .resize(120, 120, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;
    for (let i = 0; i < data.length; i += channels) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }
  } catch {
    return NextResponse.json(
      { error: "sharp not available — run: npm install sharp" },
      { status: 500 }
    );
  }

  // Sample down to max 3000 pixels for speed
  const stride = Math.max(1, Math.floor(pixels.length / 3000));
  const sampled = pixels.filter((_, i) => i % stride === 0);

  const K = 8;
  const palette = kMeans(sampled, K);

  // Map to 60/30/10 suggestion: top 3 clusters
  const [dominant, mid, highlight] = palette.slice(0, 3).map(rgbToHex);

  return NextResponse.json({
    palette: palette.slice(0, 6).map(rgbToHex),
    suggestion: { dominant, mid, highlight },
  });
}
