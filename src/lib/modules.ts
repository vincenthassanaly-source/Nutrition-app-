import { createElement, type ReactNode } from "react";

export type AppModule = {
  href: string;
  label: string;
  description: string;
  icon: (color: string) => ReactNode;
  accentVar: string;
};

// Nutrition, Tâches et Habitudes vivent désormais dans la barre de
// navigation principale (voir BottomNav) : cette grille "Plus" ne liste que
// les modules secondaires, accessibles en un tap depuis l'onglet Plus.
export const MODULES: AppModule[] = [
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
    href: "/courses",
    label: "Courses",
    description: "Liste de courses",
    accentVar: "var(--accent-courses)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("path", { d: "M7 8V6a5 5 0 0 1 10 0v2" }),
        createElement("path", { d: "M5.5 8h13l-1 11.5a1.5 1.5 0 0 1-1.5 1.5H8a1.5 1.5 0 0 1-1.5-1.5L5.5 8z" })
      ),
  },
  {
    href: "/budget",
    label: "Budget",
    description: "Comptes, dépenses et budgets par catégorie",
    accentVar: "var(--accent-budget)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("rect", { x: 3.5, y: 6.5, width: 17, height: 12.5, rx: 2.5 }),
        createElement("path", { d: "M3.5 10.5h17" }),
        createElement("circle", { cx: 16.5, cy: 14.5, r: 1.1, fill: c, stroke: "none" })
      ),
  },
  {
    href: "/objectifs",
    label: "Objectifs",
    description: "Objectifs perso et pro, avec échéance",
    accentVar: "var(--accent-objectifs)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("circle", { cx: 12, cy: 12, r: 8.5 }),
        createElement("circle", { cx: 12, cy: 12, r: 4.5 }),
        createElement("circle", { cx: 12, cy: 12, r: 0.8, fill: c })
      ),
  },
  {
    href: "/collection",
    label: "Collection",
    description: "Photos organisées par collection",
    accentVar: "var(--accent-collection)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("path", { d: "M8.5 20.5h9a2 2 0 0 0 2-2v-9" }),
        createElement("rect", { x: 3.5, y: 3.5, width: 12.5, height: 12.5, rx: 2.5 }),
        createElement("circle", { cx: 7.2, cy: 7.2, r: 1, fill: c, stroke: "none" }),
        createElement("path", { d: "M4.5 13l2.7-3.1 3 3.3 2-2.2 3.3 3.5" })
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
    href: "/reglages",
    label: "Réglages",
    description: "Profil, apparence et préférences",
    accentVar: "var(--accent-reglages)",
    icon: (c) =>
      createElement(
        "svg",
        { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: c, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
        createElement("circle", { cx: 12, cy: 12, r: 3 }),
        createElement("path", {
          d: "M19.4 13.5c.1-.5.1-1 0-1.5l1.6-1.2-1.5-2.6-1.9.6a5.4 5.4 0 0 0-1.3-.75l-.3-2H10l-.3 2a5.4 5.4 0 0 0-1.3.75l-1.9-.6-1.5 2.6 1.6 1.2c-.1.5-.1 1 0 1.5l-1.6 1.2 1.5 2.6 1.9-.6c.4.3.85.55 1.3.75l.3 2h4l.3-2c.45-.2.9-.45 1.3-.75l1.9.6 1.5-2.6z",
        })
      ),
  },
];
