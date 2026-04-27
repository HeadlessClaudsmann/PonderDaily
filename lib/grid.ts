import { prisma } from "./prisma";

export type AgeBand = "6-8" | "9-12" | "13-16";

export async function getGrid(ageBand: AgeBand, date?: Date) {
  const d = date ?? new Date();
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return prisma.dailyGrid.findFirst({
    where: {
      ageBand,
      date: { gte: start, lt: end },
      publishedAt: { not: null },
    },
    include: {
      pieces: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

// Returns all dates that have a published grid for a given band, newest first
export async function getPublishedDates(ageBand: AgeBand) {
  const grids = await prisma.dailyGrid.findMany({
    where: { ageBand, publishedAt: { not: null } },
    select: { date: true },
    orderBy: { date: "desc" },
  });
  return grids.map((g) => g.date);
}
