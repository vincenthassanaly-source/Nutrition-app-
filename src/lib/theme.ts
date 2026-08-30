export const THEME_STORAGE_KEY = "kilio-theme";

// Injecté en inline script dans <head> pour appliquer la classe `dark` avant
// le premier paint (évite le flash de thème clair). Lit le choix persisté,
// sinon retombe sur la préférence système.
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var dark = stored ? stored === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;
