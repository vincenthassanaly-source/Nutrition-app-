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
  {
    href: "/agenda",
    label: "Agenda",
    description: "Vues calendrier des tâches à échéance",
    accentVar: "var(--accent-agenda)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("rect", { x: 3.5, y: 4.5, width: 17, height: 16, rx: 3 }),
        createElement("path", { d: "M3.5 9.5h17" }),
        createElement("path", { d: "M8 3v3M16 3v3" })
      ),
  },
  {
    href: "/habitudes",
    label: "Habitudes",
    description: "Suivi quotidien et streaks",
    accentVar: "var(--accent-habitudes)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("path", {
          d: "M12 3.5c1.2 2.6-.4 3.9-1.4 5-1.3 1.4-1.9 2.7-1.9 4.2a5.3 5.3 0 0 0 10.6 0c0-1.9-1-3.4-2.1-4.5.2 1.6-.5 2.3-1.2 2.3-1 0-1.4-.9-1.1-2 .4-1.5.4-3.2-2.9-5z",
        })
      ),
  },
];
