"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/actions/auth";
import { errorText, input, label as labelClass, linkButton, primaryButton } from "@/lib/ui";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 shadow-card">
        <h1 className="mb-1 text-center font-display text-2xl font-semibold text-kcal">Nutrition</h1>
        <p className="mb-8 text-center text-sm text-ink-2">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" className={input} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className={labelClass}>
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={input}
            />
          </div>

          {state.error && (
            <p className={errorText} role="alert">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className={`mt-2 ${primaryButton}`}>
            {pending ? "Chargement..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className={`mt-4 w-full text-center ${linkButton}`}
        >
          {mode === "signin" ? "Pas encore de compte ? Inscription" : "Déjà un compte ? Connexion"}
        </button>
      </div>
    </main>
  );
}
