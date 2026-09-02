import { NextResponse, type NextRequest } from "next/server";
import { uploaderPhotosPartagees } from "@/app/actions/collections";

// Cible du Web Share Target déclaré dans public/manifest.json : reçoit les
// photos partagées depuis une autre app Android (Galerie, etc.), les
// compresse et les upload immédiatement dans le bucket collection-images
// (sans les rattacher à une collection), puis redirige vers l'écran de
// sélection de collection avec un paramètre `photo` par photo uploadée.
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const fichiers = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);

  const url = new URL("/collection/partage/choisir", request.url);

  if (fichiers.length === 0) {
    return NextResponse.redirect(url, 303);
  }

  const urls = await uploaderPhotosPartagees(fichiers);
  for (const photoUrl of urls) {
    url.searchParams.append("photo", photoUrl);
  }

  return NextResponse.redirect(url, 303);
}
