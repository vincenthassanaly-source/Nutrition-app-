"use client";

import { useTransition } from "react";
import { supprimerCategorie } from "@/app/actions/categories-budget";
import type { SuiviCategorie } from "@/app/actions/budgets";
import type { Tables } from "@/lib/supabase/types";
import { dangerButton, eyebrow, listCard, nameText, pillTag, sectionTitle } from "@/lib/ui";
import { CategorieProgressCard } from "./CategorieProgressCard";

function CategorieRevenuRow({ categorie }: { categorie: Tables<"categories_budget"> }) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className={listCard}>
      <div className="flex items-center justify-between gap-2">
        <p className={nameText}>
          {categorie.icone && <span className="mr-1.5">{categorie.icone}</span>}
          {categorie.nom}
        </p>
        {categorie.is_predefinie ? (
          <span className={pillTag}>Prédéfinie</span>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => startTransition(() => supprimerCategorie(categorie.id))}
            className={dangerButton}
          >
            Suppr.
          </button>
        )}
      </div>
    </li>
  );
}

export function CategoriesList({
  suiviDepenses,
  categoriesRevenu,
  periode,
}: {
  suiviDepenses: SuiviCategorie[];
  categoriesRevenu: Tables<"categories_budget">[];
  periode: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <h2 className={sectionTitle}>Dépenses</h2>
        {suiviDepenses.length === 0 ? (
          <p className="text-ink-2">Aucune catégorie de dépense pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {suiviDepenses.map((suivi) => (
              <CategorieProgressCard key={suivi.categorie.id} suivi={suivi} periode={periode} />
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className={sectionTitle}>Revenus</h2>
        {categoriesRevenu.length === 0 ? (
          <p className={eyebrow}>Aucune catégorie de revenu pour l&apos;instant.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {categoriesRevenu.map((categorie) => (
              <CategorieRevenuRow key={categorie.id} categorie={categorie} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
