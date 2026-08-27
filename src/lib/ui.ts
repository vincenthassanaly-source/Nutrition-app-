// Shared Tailwind class fragments for the "Nutrition — mobile" design system.
// Keeps cards/buttons/inputs visually consistent across screens.

export const card = "rounded-2xl border border-line bg-surface p-4 shadow-card";
export const cardTight = "rounded-2xl border border-line bg-surface p-3.5 shadow-card";

export const screenTitle = "font-display text-2xl font-semibold text-ink";
export const sectionTitle = "text-[15px] font-bold text-ink";
export const eyebrow = "text-[12.5px] text-ink-2";

export const input =
  "rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-kcal/60 transition-colors";
export const label = "text-sm font-medium text-ink";
export const errorText = "text-sm text-alert";

export const primaryButton =
  "rounded-2xl bg-kcal px-4 py-2.5 font-semibold text-white transition-opacity disabled:opacity-60";
export const secondaryButton =
  "rounded-2xl border border-line bg-surface px-4 py-2.5 font-semibold text-ink transition-colors disabled:opacity-60";
export const dashedAddButton =
  "w-full rounded-2xl border border-dashed border-kcal/50 py-3 font-semibold text-kcal transition-colors hover:bg-kcal/5";

export const ghostButton =
  "rounded-xl border border-line px-2.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-alt";
export const dangerButton =
  "rounded-xl border border-alert/30 px-2.5 py-1.5 text-sm font-medium text-alert transition-colors disabled:opacity-60";
export const linkButton = "text-sm font-semibold text-kcal";

export const pillTag =
  "shrink-0 rounded-full bg-surface-alt px-2.5 py-1 text-[11px] font-semibold text-ink-2";
export const kcalPillTag =
  "shrink-0 rounded-full bg-kcal/10 px-2.5 py-1 text-[11px] font-bold text-kcal";

export const listCard =
  "flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-3.5 shadow-card";

export const nameText = "text-[14.5px] font-semibold text-ink truncate";
export const metaText = "text-xs text-ink-2 font-mono";
