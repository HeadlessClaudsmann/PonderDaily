import { getGrid } from "@/lib/grid";
import BandSwitcher from "@/components/BandSwitcher";

export const metadata = {
  title: "Ages 13–16 — Ponder Daily",
  description: "Today's reading for older readers aged 13 to 16.",
};

export const revalidate = 3600;

export default async function Band1316Page() {
  const grid = await getGrid("13-16");
  return <BandSwitcher initialBand="13-16" initialPieces={grid?.pieces ?? []} />;
}
