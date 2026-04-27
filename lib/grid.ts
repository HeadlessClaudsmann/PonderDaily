import { prisma } from "./prisma";

export type AgeBand = "6-8" | "9-12" | "13-16";

export async function getTodayGrid(ageBand: AgeBand) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const grid = await prisma.dailyGrid.findFirst({
    where: {
      ageBand,
      date: { gte: today, lt: tomorrow },
      publishedAt: { not: null },
    },
    include: {
      pieces: {
        where: { status: "published" },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return grid;
}
