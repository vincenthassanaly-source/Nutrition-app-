import { QueryClient } from "@tanstack/react-query";

// QueryClient dédié au prefetch côté serveur (Server Components) : une
// instance par requête, jamais partagée entre utilisateurs/requêtes — à
// l'inverse de `browserQueryClient` dans providers.tsx qui, lui, est un
// singleton réutilisé côté navigateur.
export function makeServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
      },
    },
  });
}
