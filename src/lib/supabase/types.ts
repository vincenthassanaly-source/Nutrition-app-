export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      aliments: {
        Row: {
          acides_gras_satures_100g: number | null
          categorie: string | null
          created_at: string
          fibres_100g: number | null
          glucides_100g: number
          id: string
          kcal_100g: number
          lipides_100g: number
          nom: string
          poids_unite_g: number | null
          proteines_100g: number
          sel_100g: number | null
          sucres_100g: number | null
          unite: Database["public"]["Enums"]["unite_mesure"]
          updated_at: string
        }
        Insert: {
          acides_gras_satures_100g?: number | null
          categorie?: string | null
          created_at?: string
          fibres_100g?: number | null
          glucides_100g?: number
          id?: string
          kcal_100g: number
          lipides_100g?: number
          nom: string
          poids_unite_g?: number | null
          proteines_100g?: number
          sel_100g?: number | null
          sucres_100g?: number | null
          unite?: Database["public"]["Enums"]["unite_mesure"]
          updated_at?: string
        }
        Update: {
          acides_gras_satures_100g?: number | null
          categorie?: string | null
          created_at?: string
          fibres_100g?: number | null
          glucides_100g?: number
          id?: string
          kcal_100g?: number
          lipides_100g?: number
          nom?: string
          poids_unite_g?: number | null
          proteines_100g?: number
          sel_100g?: number | null
          sucres_100g?: number | null
          unite?: Database["public"]["Enums"]["unite_mesure"]
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          categorie_id: string
          created_at: string
          id: string
          montant_cible: number
          periode: string
          type_periode: Database["public"]["Enums"]["type_periode_budget"]
          updated_at: string
        }
        Insert: {
          categorie_id: string
          created_at?: string
          id?: string
          montant_cible: number
          periode: string
          type_periode?: Database["public"]["Enums"]["type_periode_budget"]
          updated_at?: string
        }
        Update: {
          categorie_id?: string
          created_at?: string
          id?: string
          montant_cible?: number
          periode?: string
          type_periode?: Database["public"]["Enums"]["type_periode_budget"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budgets_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_budget"
            referencedColumns: ["id"]
          },
        ]
      }
      categories_budget: {
        Row: {
          categorie_parent_id: string | null
          created_at: string
          icone: string | null
          id: string
          is_predefinie: boolean
          nom: string
          type: Database["public"]["Enums"]["type_mouvement"]
          updated_at: string
        }
        Insert: {
          categorie_parent_id?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          is_predefinie?: boolean
          nom: string
          type: Database["public"]["Enums"]["type_mouvement"]
          updated_at?: string
        }
        Update: {
          categorie_parent_id?: string | null
          created_at?: string
          icone?: string | null
          id?: string
          is_predefinie?: boolean
          nom?: string
          type?: Database["public"]["Enums"]["type_mouvement"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_budget_categorie_parent_id_fkey"
            columns: ["categorie_parent_id"]
            isOneToOne: false
            referencedRelation: "categories_budget"
            referencedColumns: ["id"]
          },
        ]
      }
      comptes: {
        Row: {
          created_at: string
          id: string
          nom: string
          solde_initial: number
          type: Database["public"]["Enums"]["type_compte"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          solde_initial?: number
          type?: Database["public"]["Enums"]["type_compte"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          solde_initial?: number
          type?: Database["public"]["Enums"]["type_compte"]
          updated_at?: string
        }
        Relationships: []
      }
      courses_items: {
        Row: {
          coche: boolean
          created_at: string
          id: string
          libelle: string
          updated_at: string
        }
        Insert: {
          coche?: boolean
          created_at?: string
          id?: string
          libelle: string
          updated_at?: string
        }
        Update: {
          coche?: boolean
          created_at?: string
          id?: string
          libelle?: string
          updated_at?: string
        }
        Relationships: []
      }
      habitude_entries: {
        Row: {
          created_at: string
          date: string
          habitude_id: string
          id: string
          valeur: number
        }
        Insert: {
          created_at?: string
          date: string
          habitude_id: string
          id?: string
          valeur?: number
        }
        Update: {
          created_at?: string
          date?: string
          habitude_id?: string
          id?: string
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "habitude_entries_habitude_id_fkey"
            columns: ["habitude_id"]
            isOneToOne: false
            referencedRelation: "habitudes"
            referencedColumns: ["id"]
          },
        ]
      }
      habitudes: {
        Row: {
          actif: boolean
          created_at: string
          icone: string | null
          id: string
          nom: string
          ordre: number
          type: Database["public"]["Enums"]["habitude_type"]
          unite: string | null
          updated_at: string
          valeur_cible: number | null
        }
        Insert: {
          actif?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          nom: string
          ordre?: number
          type?: Database["public"]["Enums"]["habitude_type"]
          unite?: string | null
          updated_at?: string
          valeur_cible?: number | null
        }
        Update: {
          actif?: boolean
          created_at?: string
          icone?: string | null
          id?: string
          nom?: string
          ordre?: number
          type?: Database["public"]["Enums"]["habitude_type"]
          unite?: string | null
          updated_at?: string
          valeur_cible?: number | null
        }
        Relationships: []
      }
      journal_repas: {
        Row: {
          aliment_id: string | null
          created_at: string
          date: string
          id: string
          moment: Database["public"]["Enums"]["moment_repas"]
          quantite: number
          recette_id: string | null
        }
        Insert: {
          aliment_id?: string | null
          created_at?: string
          date?: string
          id?: string
          moment: Database["public"]["Enums"]["moment_repas"]
          quantite: number
          recette_id?: string | null
        }
        Update: {
          aliment_id?: string | null
          created_at?: string
          date?: string
          id?: string
          moment?: Database["public"]["Enums"]["moment_repas"]
          quantite?: number
          recette_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_repas_aliment_id_fkey"
            columns: ["aliment_id"]
            isOneToOne: false
            referencedRelation: "aliments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_repas_recette_id_fkey"
            columns: ["recette_id"]
            isOneToOne: false
            referencedRelation: "recettes"
            referencedColumns: ["id"]
          },
        ]
      }
      listes_taches: {
        Row: {
          couleur: string | null
          created_at: string
          id: string
          nom: string
          ordre: number
          updated_at: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          id?: string
          nom: string
          ordre?: number
          updated_at?: string
        }
        Update: {
          couleur?: string | null
          created_at?: string
          id?: string
          nom?: string
          ordre?: number
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          contenu: string
          created_at: string
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          contenu: string
          created_at?: string
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          contenu?: string
          created_at?: string
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      objectif_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          objectif_id: string
          valeur: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          objectif_id: string
          valeur: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          objectif_id?: string
          valeur?: number
        }
        Relationships: [
          {
            foreignKeyName: "objectif_entries_objectif_id_fkey"
            columns: ["objectif_id"]
            isOneToOne: false
            referencedRelation: "objectifs"
            referencedColumns: ["id"]
          },
        ]
      }
      objectif_etapes: {
        Row: {
          created_at: string
          fait: boolean
          id: string
          objectif_id: string
          ordre: number
          titre: string
        }
        Insert: {
          created_at?: string
          fait?: boolean
          id?: string
          objectif_id: string
          ordre?: number
          titre: string
        }
        Update: {
          created_at?: string
          fait?: boolean
          id?: string
          objectif_id?: string
          ordre?: number
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "objectif_etapes_objectif_id_fkey"
            columns: ["objectif_id"]
            isOneToOne: false
            referencedRelation: "objectifs"
            referencedColumns: ["id"]
          },
        ]
      }
      objectifs: {
        Row: {
          categorie: Database["public"]["Enums"]["categorie_objectif"]
          created_at: string
          date_echeance: string | null
          description: string | null
          id: string
          ordre: number
          statut: Database["public"]["Enums"]["statut_objectif"]
          titre: string
          type_suivi: Database["public"]["Enums"]["type_suivi_objectif"]
          unite: string | null
          updated_at: string
          valeur_cible: number | null
        }
        Insert: {
          categorie?: Database["public"]["Enums"]["categorie_objectif"]
          created_at?: string
          date_echeance?: string | null
          description?: string | null
          id?: string
          ordre?: number
          statut?: Database["public"]["Enums"]["statut_objectif"]
          titre: string
          type_suivi?: Database["public"]["Enums"]["type_suivi_objectif"]
          unite?: string | null
          updated_at?: string
          valeur_cible?: number | null
        }
        Update: {
          categorie?: Database["public"]["Enums"]["categorie_objectif"]
          created_at?: string
          date_echeance?: string | null
          description?: string | null
          id?: string
          ordre?: number
          statut?: Database["public"]["Enums"]["statut_objectif"]
          titre?: string
          type_suivi?: Database["public"]["Enums"]["type_suivi_objectif"]
          unite?: string | null
          updated_at?: string
          valeur_cible?: number | null
        }
        Relationships: []
      }
      objectifs_nutritionnels: {
        Row: {
          created_at: string
          glucides_cible_g: number
          id: string
          jour_type: Database["public"]["Enums"]["jour_type_ppl"]
          kcal_cible: number
          lipides_cible_g: number
          proteines_cible_g: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          glucides_cible_g?: number
          id?: string
          jour_type?: Database["public"]["Enums"]["jour_type_ppl"]
          kcal_cible: number
          lipides_cible_g?: number
          proteines_cible_g?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          glucides_cible_g?: number
          id?: string
          jour_type?: Database["public"]["Enums"]["jour_type_ppl"]
          kcal_cible?: number
          lipides_cible_g?: number
          proteines_cible_g?: number
          updated_at?: string
        }
        Relationships: []
      }
      recette_etapes: {
        Row: {
          astuce: string | null
          consigne: string
          created_at: string
          id: string
          ordre: number
          recette_id: string
          titre: string | null
          updated_at: string
        }
        Insert: {
          astuce?: string | null
          consigne: string
          created_at?: string
          id?: string
          ordre: number
          recette_id: string
          titre?: string | null
          updated_at?: string
        }
        Update: {
          astuce?: string | null
          consigne?: string
          created_at?: string
          id?: string
          ordre?: number
          recette_id?: string
          titre?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recette_etapes_recette_id_fkey"
            columns: ["recette_id"]
            isOneToOne: false
            referencedRelation: "recettes"
            referencedColumns: ["id"]
          },
        ]
      }
      recette_ingredients: {
        Row: {
          aliment_id: string
          id: string
          quantite: number
          recette_id: string
          unite: Database["public"]["Enums"]["unite_mesure"]
        }
        Insert: {
          aliment_id: string
          id?: string
          quantite: number
          recette_id: string
          unite: Database["public"]["Enums"]["unite_mesure"]
        }
        Update: {
          aliment_id?: string
          id?: string
          quantite?: number
          recette_id?: string
          unite?: Database["public"]["Enums"]["unite_mesure"]
        }
        Relationships: [
          {
            foreignKeyName: "recette_ingredients_aliment_id_fkey"
            columns: ["aliment_id"]
            isOneToOne: false
            referencedRelation: "aliments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recette_ingredients_recette_id_fkey"
            columns: ["recette_id"]
            isOneToOne: false
            referencedRelation: "recettes"
            referencedColumns: ["id"]
          },
        ]
      }
      recette_ingredients_libres: {
        Row: {
          created_at: string
          id: string
          nom: string
          ordre: number
          quantite: string | null
          recette_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          ordre?: number
          quantite?: string | null
          recette_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          ordre?: number
          quantite?: string | null
          recette_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recette_ingredients_libres_recette_id_fkey"
            columns: ["recette_id"]
            isOneToOne: false
            referencedRelation: "recettes"
            referencedColumns: ["id"]
          },
        ]
      }
      recettes: {
        Row: {
          created_at: string
          description: string | null
          fibres_100g: number | null
          fibres_portion: number | null
          glucides_100g: number | null
          glucides_portion: number | null
          id: string
          kcal_100g: number | null
          kcal_portion: number | null
          lipides_100g: number | null
          lipides_portion: number | null
          nom: string
          portions: number
          proteines_100g: number | null
          proteines_portion: number | null
          satures_100g: number | null
          satures_portion: number | null
          sel_100g: number | null
          sel_portion: number | null
          source: Database["public"]["Enums"]["recette_source"]
          sucres_100g: number | null
          sucres_portion: number | null
          temps_prepa_min: number | null
          updated_at: string
          ustensiles: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          fibres_100g?: number | null
          fibres_portion?: number | null
          glucides_100g?: number | null
          glucides_portion?: number | null
          id?: string
          kcal_100g?: number | null
          kcal_portion?: number | null
          lipides_100g?: number | null
          lipides_portion?: number | null
          nom: string
          portions?: number
          proteines_100g?: number | null
          proteines_portion?: number | null
          satures_100g?: number | null
          satures_portion?: number | null
          sel_100g?: number | null
          sel_portion?: number | null
          source?: Database["public"]["Enums"]["recette_source"]
          sucres_100g?: number | null
          sucres_portion?: number | null
          temps_prepa_min?: number | null
          updated_at?: string
          ustensiles?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          fibres_100g?: number | null
          fibres_portion?: number | null
          glucides_100g?: number | null
          glucides_portion?: number | null
          id?: string
          kcal_100g?: number | null
          kcal_portion?: number | null
          lipides_100g?: number | null
          lipides_portion?: number | null
          nom?: string
          portions?: number
          proteines_100g?: number | null
          proteines_portion?: number | null
          satures_100g?: number | null
          satures_portion?: number | null
          sel_100g?: number | null
          sel_portion?: number | null
          source?: Database["public"]["Enums"]["recette_source"]
          sucres_100g?: number | null
          sucres_portion?: number | null
          temps_prepa_min?: number | null
          updated_at?: string
          ustensiles?: string[] | null
        }
        Relationships: []
      }
      sous_taches: {
        Row: {
          created_at: string
          fait: boolean
          id: string
          ordre: number
          tache_id: string
          titre: string
        }
        Insert: {
          created_at?: string
          fait?: boolean
          id?: string
          ordre?: number
          tache_id: string
          titre: string
        }
        Update: {
          created_at?: string
          fait?: boolean
          id?: string
          ordre?: number
          tache_id?: string
          titre?: string
        }
        Relationships: [
          {
            foreignKeyName: "sous_taches_tache_id_fkey"
            columns: ["tache_id"]
            isOneToOne: false
            referencedRelation: "taches"
            referencedColumns: ["id"]
          },
        ]
      }
      taches: {
        Row: {
          created_at: string
          echeance: string | null
          fait: boolean
          heure: string | null
          id: string
          liste_id: string
          notes: string | null
          ordre: number
          priorite: Database["public"]["Enums"]["priorite_tache"]
          recurrence_fin: string | null
          recurrence_frequence:
            | Database["public"]["Enums"]["frequence_recurrence"]
            | null
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          echeance?: string | null
          fait?: boolean
          heure?: string | null
          id?: string
          liste_id: string
          notes?: string | null
          ordre?: number
          priorite?: Database["public"]["Enums"]["priorite_tache"]
          recurrence_fin?: string | null
          recurrence_frequence?:
            | Database["public"]["Enums"]["frequence_recurrence"]
            | null
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          echeance?: string | null
          fait?: boolean
          heure?: string | null
          id?: string
          liste_id?: string
          notes?: string | null
          ordre?: number
          priorite?: Database["public"]["Enums"]["priorite_tache"]
          recurrence_fin?: string | null
          recurrence_frequence?:
            | Database["public"]["Enums"]["frequence_recurrence"]
            | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_liste_id_fkey"
            columns: ["liste_id"]
            isOneToOne: false
            referencedRelation: "listes_taches"
            referencedColumns: ["id"]
          },
        ]
      }
      taches_tags: {
        Row: {
          tache_id: string
          tag_id: string
        }
        Insert: {
          tache_id: string
          tag_id: string
        }
        Update: {
          tache_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taches_tags_tache_id_fkey"
            columns: ["tache_id"]
            isOneToOne: false
            referencedRelation: "taches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "taches_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          couleur: string | null
          created_at: string
          id: string
          nom: string
        }
        Insert: {
          couleur?: string | null
          created_at?: string
          id?: string
          nom: string
        }
        Update: {
          couleur?: string | null
          created_at?: string
          id?: string
          nom?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          categorie_id: string | null
          compte_destination_id: string | null
          compte_id: string
          created_at: string
          date_operation: string
          id: string
          libelle: string | null
          montant: number
          transaction_recurrente_id: string | null
          type: Database["public"]["Enums"]["type_mouvement"]
          updated_at: string
        }
        Insert: {
          categorie_id?: string | null
          compte_destination_id?: string | null
          compte_id: string
          created_at?: string
          date_operation?: string
          id?: string
          libelle?: string | null
          montant: number
          transaction_recurrente_id?: string | null
          type: Database["public"]["Enums"]["type_mouvement"]
          updated_at?: string
        }
        Update: {
          categorie_id?: string | null
          compte_destination_id?: string | null
          compte_id?: string
          created_at?: string
          date_operation?: string
          id?: string
          libelle?: string | null
          montant?: number
          transaction_recurrente_id?: string | null
          type?: Database["public"]["Enums"]["type_mouvement"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_compte_destination_id_fkey"
            columns: ["compte_destination_id"]
            isOneToOne: false
            referencedRelation: "comptes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "comptes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_transaction_recurrente_id_fkey"
            columns: ["transaction_recurrente_id"]
            isOneToOne: false
            referencedRelation: "transactions_recurrentes"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_recurrentes: {
        Row: {
          active: boolean
          categorie_id: string | null
          compte_destination_id: string | null
          compte_id: string
          created_at: string
          date_debut: string
          date_fin: string | null
          frequence: Database["public"]["Enums"]["frequence_recurrence"]
          id: string
          libelle: string | null
          montant: number
          prochaine_occurrence: string
          type: Database["public"]["Enums"]["type_mouvement"]
          updated_at: string
        }
        Insert: {
          active?: boolean
          categorie_id?: string | null
          compte_destination_id?: string | null
          compte_id: string
          created_at?: string
          date_debut: string
          date_fin?: string | null
          frequence: Database["public"]["Enums"]["frequence_recurrence"]
          id?: string
          libelle?: string | null
          montant: number
          prochaine_occurrence: string
          type: Database["public"]["Enums"]["type_mouvement"]
          updated_at?: string
        }
        Update: {
          active?: boolean
          categorie_id?: string | null
          compte_destination_id?: string | null
          compte_id?: string
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          frequence?: Database["public"]["Enums"]["frequence_recurrence"]
          id?: string
          libelle?: string | null
          montant?: number
          prochaine_occurrence?: string
          type?: Database["public"]["Enums"]["type_mouvement"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_recurrentes_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories_budget"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrentes_compte_destination_id_fkey"
            columns: ["compte_destination_id"]
            isOneToOne: false
            referencedRelation: "comptes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_recurrentes_compte_id_fkey"
            columns: ["compte_id"]
            isOneToOne: false
            referencedRelation: "comptes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      categorie_objectif: "perso" | "pro"
      frequence_recurrence: "quotidien" | "hebdomadaire" | "mensuel" | "annuel"
      habitude_type: "boolean" | "streak" | "quantifiee"
      jour_type_ppl: "entrainement" | "repos"
      moment_repas: "petit_dej" | "dejeuner" | "diner" | "collation"
      priorite_tache: "aucune" | "basse" | "moyenne" | "haute"
      recette_source: "manuel" | "hellofresh"
      statut_objectif: "en_cours" | "atteint" | "abandonne"
      type_compte: "courant" | "epargne" | "autre"
      type_mouvement: "depense" | "revenu" | "virement"
      type_periode_budget: "hebdomadaire" | "mensuel" | "annuel"
      type_suivi_objectif: "valeur" | "etapes" | "binaire"
      unite_mesure: "g" | "ml" | "piece"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      categorie_objectif: ["perso", "pro"],
      frequence_recurrence: ["quotidien", "hebdomadaire", "mensuel", "annuel"],
      habitude_type: ["boolean", "streak", "quantifiee"],
      jour_type_ppl: ["entrainement", "repos"],
      moment_repas: ["petit_dej", "dejeuner", "diner", "collation"],
      priorite_tache: ["aucune", "basse", "moyenne", "haute"],
      recette_source: ["manuel", "hellofresh"],
      statut_objectif: ["en_cours", "atteint", "abandonne"],
      type_compte: ["courant", "epargne", "autre"],
      type_mouvement: ["depense", "revenu", "virement"],
      type_periode_budget: ["hebdomadaire", "mensuel", "annuel"],
      type_suivi_objectif: ["valeur", "etapes", "binaire"],
      unite_mesure: ["g", "ml", "piece"],
    },
  },
} as const
