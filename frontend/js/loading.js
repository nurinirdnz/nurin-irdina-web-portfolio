/* Loading state for the API-fed project area only; every static section renders immediately. */
(() => {
  "use strict";
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  let observer, timer, work, finished = false;
  root.classList.add("portfolio-loading");

  const featuredSkeleton = `<p class="sr-only" role="status">Loading projects…</p>
    <div class="rolling-stage" data-skeleton aria-hidden="true">
      <div class="project-card loading-project">
        <div class="rolling-card-header"><div class="skeleton-block skeleton-caption"></div></div>
        <div class="rolling-card-body">
          <div class="project-info">
            <div class="skeleton-block skeleton-title"></div>
            <div class="skeleton-block skeleton-copy skeleton-lines"></div>
            <div class="tags"><div class="skeleton-block skeleton-pill"></div><div class="skeleton-block skeleton-pill"></div><div class="skeleton-block skeleton-pill"></div></div>
            <div class="skeleton-block skeleton-copy skeleton-lines"></div>
            <div class="skeleton-block skeleton-action"></div>
          </div>
          <div class="project-visual"><div class="skeleton-block skeleton-diagram"></div></div>
        </div>
      </div>
    </div>`;
  // Reserve the archive's space too, so sections below do not jump when data arrives.
  const archiveSkeleton = Array.from({ length: 4 }, () => `<div class="archive-item loading-archive" data-skeleton aria-hidden="true">
      <span></span><div><div class="skeleton-block skeleton-caption"></div><div class="skeleton-block skeleton-copy skeleton-lines"></div></div>
    </div>`).join("");

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    observer?.disconnect();
    work?.removeAttribute("aria-busy");
    // Real content cross-fades in where the placeholders were.
    if (!motion.matches) {
      for (const region of [document.querySelector("#featured-grid"), document.querySelector("#archive")]) {
        if (!region || region.querySelector("[data-skeleton]")) continue;
        region.classList.add("portfolio-entering");
        region.addEventListener("animationend", event => {
          if (event.target === region) region.classList.remove("portfolio-entering");
        }, { once: true });
      }
    }
    root.classList.remove("portfolio-loading");
    document.dispatchEvent(new Event("portfolio:ready"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (finished) return;
    work = document.querySelector("#work");
    const projects = document.querySelector("#featured-grid");
    const archive = document.querySelector("#archive");
    if (!work || !projects) { finish(); return; }
    // app.js replaces both placeholders with real content (or an error message).
    if (projects.textContent.trim() === "Loading projects…") projects.innerHTML = featuredSkeleton;
    if (archive && !archive.children.length) archive.innerHTML = archiveSkeleton;
    if (!work.querySelector("[data-skeleton]")) { finish(); return; }
    work.setAttribute("aria-busy", "true");
    observer = new MutationObserver(() => {
      if (!work.querySelector("[data-skeleton]")) finish();
    });
    observer.observe(work, { childList: true, subtree: true });
    // Safety net slightly beyond app.js's 10s fetch timeout.
    timer = setTimeout(finish, 11000);
  }, { once: true });

  addEventListener("beforeprint", finish, { once: true });
  addEventListener("pagehide", finish, { once: true });
})();
