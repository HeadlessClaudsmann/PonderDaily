import { getGrid, getPublishedDates } from "@/lib/grid";
import BandPage from "@/components/BandPage";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const dates = await getPublishedDates("9-12");
  return dates.map((d) => ({ date: d.toISOString().slice(0, 10) }));
}

export const revalidate = 3600;

export default async function Band912DatePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) notFound();

  const grid = await getGrid("9-12", parsed);
  if (!grid) notFound();

  return (
    <BandPage
      ageBand="9-12"
      label="Ages 9–12"
      tagline="Real events, how things work, and questions worth arguing about."
      accentColor="var(--pd-912-accent)"
      pieces={grid.pieces}
      date={parsed}
    />
  );
}
