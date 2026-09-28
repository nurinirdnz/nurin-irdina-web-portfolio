/* One short, page-level loading state; existing DOM supplies exact placeholder sizes. */
(() => {
  "use strict";
  const root = document.documentElement;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const targets = [
    ".hero-copy > p", ".hero-copy h1", ".hero-actions > a", ".socials > a",
    ".profile-summary :is(p, dt, dd, a)", ".section-heading :is(p, h2)",
    ".rolling-card-caption", ".project-info :is(h3, .project-description, li)",
    ".tech-tag", ".project-actions > *", ".project-visual",
    ".archive-heading h3", ".archive-item :is(h4, p, .text-link)",
    ".experience-group > h3", ".experience-list article > *", ".timeline article > *",
    ".skill-card > *", ".about-grid :is(h3, p)",
    ".contact-grid :is(h3, p, label, input, textarea, button)",
  ].join(",");
  const masked = new Set();
  let timer, observer, main, finished = false;
  root.classList.add("portfolio-loading");

  function mask() {
    main.querySelectorAll(targets).forEach(element => {
      if (element.closest("[data-skeleton]") || element.matches('[role="status"], .sr-only')) return;
      if (masked.has(element)) return;
      masked.add(element);
      element.classList.add("skeleton-block");
      if (element.matches("h1, h2, h3, h4, p, dd, li")) element.classList.add("skeleton-lines");
    });
  }

  function finish() {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    observer?.disconnect();
    root.classList.remove("portfolio-loading", "skeleton-ready");
    masked.forEach(element => element.classList.remove("skeleton-block", "skeleton-lines"));
    masked.clear();
    if (main) {
      main.inert = false;
      main.removeAttribute("aria-busy");
      if (!motion.matches) {
        main.classList.add("portfolio-entering");
        main.addEventListener("animationend", event => {
          if (event.target === main) main.classList.remove("portfolio-entering");
        });
      }
    }
    document.dispatchEvent(new Event("portfolio:ready"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (finished) return;
    main = document.querySelector("#main");
    if (!main) { finish(); return; }
    main.inert = true;
    main.setAttribute("aria-busy", "true");
    // This placeholder belongs to the real API request and is replaced by app.js.
    // It can remain beyond 600ms on a slow connection while the rest of the page opens.
    const projects = document.querySelector("#featured-grid");
    if (projects?.textContent.trim() === "Loading projects…") {
      projects.innerHTML = `<p class="sr-only" role="status">Loading projects…</p>
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
    }
    mask();
    root.classList.add("skeleton-ready");
    observer = new MutationObserver(mask);
    observer.observe(main, { childList: true, subtree: true });
    timer = setTimeout(finish, 600);
  }, { once: true });

  // Never delay intentional navigation, printing, or a restored history entry.
  document.addEventListener("click", event => {
    if (event.target.closest('a[href^="#"]')) finish();
  });
  addEventListener("beforeprint", finish, { once: true });
  addEventListener("pagehide", finish, { once: true });
})();
