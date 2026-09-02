/** Bloc de base d'un skeleton : un rectangle qui pulse doucement, sur le
 * token `surface-alt` (cohérent en clair comme en sombre). Les skeletons
 * composés (CardSkeleton, ListItemSkeleton, ...) empilent ce primitif pour
 * mimer la forme du contenu réel pendant son chargement. */
export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div className={`animate-pulse rounded-lg bg-surface-alt ${className}`} style={style} />;
}
