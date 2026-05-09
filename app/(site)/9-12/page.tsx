import { getGrid } from "@/lib/grid";
import BandSwitcher from "@/components/BandSwitcher";

export const metadata = {
  title: "Ages 9–12 — Ponder Daily",
  description: "Today's reading for middle readers aged 9 to 12.",
};

export const revalidate = 3600;

export default async function Band912Page() {
  const grid = await getGrid("9-12");
  return <BandSwitcher initialBand="9-12" initialPieces={grid?.pieces ?? []} />;
}
