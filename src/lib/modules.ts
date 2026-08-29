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
];
