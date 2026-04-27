import { getTodayGrid } from "@/lib/grid";
import BandPage from "@/components/BandPage";

export const metadata = {
  title: "Ages 6–8 — Ponder Daily",
  description: "Today's reading for young readers aged 6 to 8.",
};

export const revalidate = 3600;

export default async function Band68Page() {
  const grid = await getTodayGrid("6-8");
  return (
    <BandPage
      ageBand="6-8"
      label="Ages 6–8"
      tagline="Short, vivid stories to read together and wonder about."
      accentColor="var(--pd-68-accent)"
      pieces={grid?.pieces ?? []}
    />
  );
}
