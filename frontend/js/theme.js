/* Blocking, non-deferred: sets the theme before first paint to avoid a flash of the wrong colors. */
(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("js");
  const media = matchMedia("(prefers-color-scheme: dark)");
  let stored = null;
  try {
    stored = localStorage.getItem("theme");
  } catch {}
  let theme =
    stored === "dark" || stored === "light"
      ? stored
      : media.matches
        ? "dark"
        : "light";
  root.setAttribute("data-theme", theme);
  function sync(button) {
    const dark = theme === "dark";
    button.setAttribute("aria-pressed", String(dark));
    button.setAttribute(
      "aria-label",
      dark ? "Switch to light mode" : "Switch to dark mode",
    );
  }
  function apply(next) {
    theme = next;
    root.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
    const button = document.getElementById("theme-toggle");
    if (button) sync(button);
  }
  media.addEventListener("change", (e) => {
    let hasStored = null;
    try {
      hasStored = localStorage.getItem("theme");
    } catch {}
    if (!hasStored) apply(e.matches ? "dark" : "light");
  });
  // A single crossfade avoids elements recolouring at different speeds (or flashing).
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let fadeTimer;
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    if (reducedMotion.matches) return apply(next);
    if (document.startViewTransition) {
      root.classList.add("theme-switching");
      try {
        document.startViewTransition(() => apply(next)).finished
          .finally(() => root.classList.remove("theme-switching"));
      } catch {
        root.classList.remove("theme-switching");
        apply(next);
      }
      return;
    }
    // Fallback: every surface eases its colours together for one short window.
    root.classList.add("theme-fading");
    apply(next);
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => root.classList.remove("theme-fading"), 320);
  }
  document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("theme-toggle");
    if (button) {
      sync(button);
      button.addEventListener("click", toggle);
    }
  });
})();
