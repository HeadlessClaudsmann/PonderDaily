import { getGrid, getPublishedDates } from "@/lib/grid";
import BandPage from "@/components/BandPage";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const dates = await getPublishedDates("13-16");
  return dates.map((d) => ({ date: d.toISOString().slice(0, 10) }));
}

export const revalidate = 3600;

export default async function Band1316DatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) notFound();

  const grid = await getGrid("13-16", parsed);
  if (!grid) notFound();

  return (
    <BandPage
      ageBand="13-16"
      label="Ages 13–16"
      tagline="Genuine complexity, contested ideas, and no easy answers."
      accentColor="var(--pd-1316-accent)"
      pieces={grid.pieces}
      date={parsed}
    />
  );
}
