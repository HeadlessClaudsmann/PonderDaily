import { getGrid } from "@/lib/grid";
import BandSwitcher from "@/components/BandSwitcher";

export const metadata = {
  title: "Ages 6–8 — Ponder Daily",
  description: "Today's reading for young readers aged 6 to 8.",
};

export const revalidate = 3600;

export default async function Band68Page() {
  const grid = await getGrid("6-8");
  return <BandSwitcher initialBand="6-8" initialPieces={grid?.pieces ?? []} />;
}
