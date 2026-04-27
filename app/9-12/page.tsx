import { getTodayGrid } from "@/lib/grid";
import BandPage from "@/components/BandPage";

export const metadata = {
  title: "Ages 9–12 — Ponder Daily",
  description: "Today's reading for middle readers aged 9 to 12.",
};

export const revalidate = 3600;

export default async function Band912Page() {
  const grid = await getTodayGrid("9-12");
  return (
    <BandPage
      ageBand="9-12"
      label="Ages 9–12"
      tagline="Real events, how things work, and questions worth arguing about."
      accentColor="var(--pd-912-accent)"
      pieces={grid?.pieces ?? []}
    />
  );
}
