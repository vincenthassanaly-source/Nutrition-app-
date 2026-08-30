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
      recettes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          portions: number
          source: Database["public"]["Enums"]["recette_source"]
          temps_prepa_min: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          portions?: number
          source?: Database["public"]["Enums"]["recette_source"]
          temps_prepa_min?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          portions?: number
          source?: Database["public"]["Enums"]["recette_source"]
          temps_prepa_min?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      taches: {
        Row: {
          created_at: string
          echeance: string | null
          fait: boolean
          heure: string | null
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          echeance?: string | null
          fait?: boolean
          heure?: string | null
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          echeance?: string | null
          fait?: boolean
          heure?: string | null
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      habitude_type: "boolean" | "streak" | "quantifiee"
      jour_type_ppl: "entrainement" | "repos"
      moment_repas: "petit_dej" | "dejeuner" | "diner" | "collation"
      recette_source: "manuel" | "hellofresh"
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
      habitude_type: ["boolean", "streak", "quantifiee"],
      jour_type_ppl: ["entrainement", "repos"],
      moment_repas: ["petit_dej", "dejeuner", "diner", "collation"],
      recette_source: ["manuel", "hellofresh"],
      unite_mesure: ["g", "ml", "piece"],
    },
  },
} as const
