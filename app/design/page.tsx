import type { Metadata } from "next";
import GridDesigner from "@/components/GridDesigner";

export const metadata: Metadata = { title: "Grid Designer — Ponder Daily" };

export default function DesignPage() {
  return <GridDesigner />;
}
