import { getGrid, getPublishedDates } from "@/lib/grid";
import BandPage from "@/components/BandPage";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const dates = await getPublishedDates("6-8");
  return dates.map((d) => ({ date: d.toISOString().slice(0, 10) }));
}

export const revalidate = 3600;

export default async function Band68DatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) notFound();

  const grid = await getGrid("6-8", parsed);
  if (!grid) notFound();

  return (
    <BandPage
      ageBand="6-8"
      label="Ages 6–8"
      tagline="Short, vivid stories to read together and wonder about."
      accentColor="var(--pd-68-accent)"
      pieces={grid.pieces}
      date={parsed}
    />
  );
}
