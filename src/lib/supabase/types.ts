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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      aliments: {
        Row: {
          categorie: string | null
          created_at: string
          glucides_100g: number
          id: string
          kcal_100g: number
          lipides_100g: number
          nom: string
          proteines_100g: number
          unite: Database["public"]["Enums"]["unite_mesure"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          glucides_100g?: number
          id?: string
          kcal_100g: number
          lipides_100g?: number
          nom: string
          proteines_100g?: number
          unite?: Database["public"]["Enums"]["unite_mesure"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          categorie?: string | null
          created_at?: string
          glucides_100g?: number
          id?: string
          kcal_100g?: number
          lipides_100g?: number
          nom?: string
          proteines_100g?: number
          unite?: Database["public"]["Enums"]["unite_mesure"]
          updated_at?: string
          user_id?: string | null
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
          user_id: string
        }
        Insert: {
          aliment_id?: string | null
          created_at?: string
          date?: string
          id?: string
          moment: Database["public"]["Enums"]["moment_repas"]
          quantite: number
          recette_id?: string | null
          user_id: string
        }
        Update: {
          aliment_id?: string | null
          created_at?: string
          date?: string
          id?: string
          moment?: Database["public"]["Enums"]["moment_repas"]
          quantite?: number
          recette_id?: string | null
          user_id?: string
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
      listes_courses: {
        Row: {
          created_at: string
          id: string
          nom: string
          statut: Database["public"]["Enums"]["liste_statut"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom?: string
          statut?: Database["public"]["Enums"]["liste_statut"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          statut?: Database["public"]["Enums"]["liste_statut"]
          user_id?: string
        }
        Relationships: []
      }
      listes_courses_items: {
        Row: {
          aliment_id: string
          coche: boolean
          id: string
          liste_id: string
          quantite_totale: number
          unite: Database["public"]["Enums"]["unite_mesure"]
        }
        Insert: {
          aliment_id: string
          coche?: boolean
          id?: string
          liste_id: string
          quantite_totale: number
          unite: Database["public"]["Enums"]["unite_mesure"]
        }
        Update: {
          aliment_id?: string
          coche?: boolean
          id?: string
          liste_id?: string
          quantite_totale?: number
          unite?: Database["public"]["Enums"]["unite_mesure"]
        }
        Relationships: [
          {
            foreignKeyName: "listes_courses_items_aliment_id_fkey"
            columns: ["aliment_id"]
            isOneToOne: false
            referencedRelation: "aliments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listes_courses_items_liste_id_fkey"
            columns: ["liste_id"]
            isOneToOne: false
            referencedRelation: "listes_courses"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: []
      }
      placard: {
        Row: {
          aliment_id: string
          date_peremption: string | null
          id: string
          quantite_disponible: number
          updated_at: string
          user_id: string
        }
        Insert: {
          aliment_id: string
          date_peremption?: string | null
          id?: string
          quantite_disponible?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          aliment_id?: string
          date_peremption?: string | null
          id?: string
          quantite_disponible?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placard_aliment_id_fkey"
            columns: ["aliment_id"]
            isOneToOne: false
            referencedRelation: "aliments"
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      jour_type_ppl: "entrainement" | "repos"
      liste_statut: "en_cours" | "terminee"
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
      jour_type_ppl: ["entrainement", "repos"],
      liste_statut: ["en_cours", "terminee"],
      moment_repas: ["petit_dej", "dejeuner", "diner", "collation"],
      recette_source: ["manuel", "hellofresh"],
      unite_mesure: ["g", "ml", "piece"],
    },
  },
} as const
