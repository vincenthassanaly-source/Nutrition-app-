/** Bouton rond à coche, remplace les `<input type="checkbox">` natifs pour
 * matcher le style de la maquette (cercle plein coché, contour sinon). */
export function CheckToggle({
  checked,
  onToggle,
  disabled,
  size = 22,
  color = "var(--accent-kcal)",
  label,
  className = "",
}: {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  size?: number;
  color?: string;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={label}
      aria-pressed={checked}
      className={`shrink-0 ${className}`}
    >
      <span
        className="flex items-center justify-center rounded-full border-2"
        style={{
          width: size,
          height: size,
          borderColor: checked ? color : "var(--line)",
          background: checked ? color : "transparent",
        }}
      >
        {checked && (
          <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 12 12">
            <path d="M1 6l3.2 3.2L11 2" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}
