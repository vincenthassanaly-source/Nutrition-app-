"use client";

import { useTransition } from "react";
import { deleteCourseItem, toggleCourseItem } from "@/app/actions/courses";
import type { Tables } from "@/lib/supabase/types";
import { dangerButton, listCard, nameText } from "@/lib/ui";

function CourseItemRow({ item }: { item: Tables<"courses_items"> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className={listCard}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={item.coche}
          disabled={isPending}
          onChange={() => startTransition(() => toggleCourseItem(item.id, !item.coche))}
          className="h-5 w-5 shrink-0 accent-courses"
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
