import { createElement, type ReactNode } from "react";

export type AppModule = {
  href: string;
  label: string;
  description: string;
  icon: (color: string) => ReactNode;
  accentVar: string;
};

export const MODULES: AppModule[] = [
  {
    href: "/nutrition",
    label: "Nutrition",
    description: "Journal, recettes et objectifs",
    accentVar: "var(--accent-kcal)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("path", { d: "M4 6c2.4-1.6 5.6-1.6 8 0v13c-2.4-1.6-5.6-1.6-8 0V6z" }),
        createElement("path", { d: "M20 6c-2.4-1.6-5.6-1.6-8 0v13c2.4-1.6 5.6-1.6 8 0V6z" })
      ),
  },
  {
    href: "/notes",
    label: "Notes",
    description: "Notes libres",
    accentVar: "var(--accent-protein)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("path", { d: "M6 3.5h9l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z" }),
        createElement("path", { d: "M9 9.5h6M9 13h6M9 16.5h3.5" })
      ),
  },
  {
    href: "/taches",
    label: "Tâches",
    description: "Liste de tâches à cocher",
    accentVar: "var(--accent-carbs)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("rect", { x: 3.5, y: 3.5, width: 17, height: 17, rx: 3 }),
        createElement("path", { d: "M7.5 12.5l2.5 2.5 6-6" })
      ),
  },
];
