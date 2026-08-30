"use client";

import { useTransition } from "react";
import { deleteCourseItem, toggleCourseItem } from "@/app/actions/courses";
import type { Tables } from "@/lib/supabase/types";
import { dangerButton, listCard, nameText } from "@/lib/ui";
import { CheckToggle } from "@/components/CheckToggle";

function CourseItemRow({ item }: { item: Tables<"courses_items"> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className={listCard}>
      <div className="flex items-center gap-3">
        <CheckToggle
          checked={item.coche}
          disabled={isPending}
          onToggle={() => startTransition(() => toggleCourseItem(item.id, !item.coche))}
          color="var(--accent-courses)"
          label={item.coche ? "Décocher l'article" : "Cocher l'article"}
        />
        <p className={`flex-1 ${nameText} ${item.coche ? "text-ink-2 line-through" : ""}`}>
          {item.libelle}
        </p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(() => deleteCourseItem(item.id))}
          className={dangerButton}
        >
          Suppr.
        </button>
      </div>
    </li>
  );
}

export function CoursesList({ items }: { items: Tables<"courses_items">[] }) {
  if (items.length === 0) {
    return <p className="text-ink-2">Aucun article pour l&apos;instant.</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <CourseItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
