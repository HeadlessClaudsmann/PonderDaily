import { getTodayGrid } from "@/lib/grid";
import BandPage from "@/components/BandPage";

export const metadata = {
  title: "Ages 13–16 — Ponder Daily",
  description: "Today's reading for older readers aged 13 to 16.",
};

export const revalidate = 3600;

export default async function Band1316Page() {
  const grid = await getTodayGrid("13-16");
  return (
    <BandPage
      ageBand="13-16"
      label="Ages 13–16"
      tagline="Genuine complexity, contested ideas, and no easy answers."
      accentColor="var(--pd-1316-accent)"
      pieces={grid?.pieces ?? []}
    />
  );
}
