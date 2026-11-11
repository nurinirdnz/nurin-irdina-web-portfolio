/* One-time scroll reveals shared by every page; content is visible without JS. */
(() => {
  "use strict";
  if (!("IntersectionObserver" in window)) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Hero has its own CSS entrance; dialog content arrives with the dialog itself.
  const selectors = [
    ".section-heading",
    ".rolling-card-header", ".rolling-card .project-info > *",
    ".rolling-card .project-visual", ".rolling-footer", ".archive-heading",
    ".archive-item", ".experience-group > .subsection-title", ".experience-list > article", ".timeline > article",
    ".skill-card", "details > summary", ".detail-columns > div",
    ".about-grid > div", ".contact-grid > div", ".contact form > *",
    ".footer > *",
    ".admin-shell > .eyebrow", ".admin-shell > h1", "#login-form > *",
    ".toolbar", ".message",
  ].join(",");
  const DURATION = 520;
  const STAGGER = 70;
  const MAX_DELAY = 280;
  const known = new WeakSet();
  const pending = new Map();
  let initialScan = true;

  function finish(element) {
    const state = pending.get(element);
    if (state?.timer) clearTimeout(state.timer);
    element.classList.remove("scroll-reveal", "is-revealed");
    element.style.removeProperty("--reveal-delay");
    pending.delete(element);
    observer.unobserve(element);
  }

  const observer = new IntersectionObserver(entries => {
    // Stagger only what enters together, so a lone element never waits on its siblings.
    let batch = 0;
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      // Tall elements may never reach 12% visibility; a quarter-screen of them is enough.
      const visibleEnough = entry.intersectionRatio >= 0.12
        || entry.intersectionRect.height >= innerHeight * 0.25;
      if (!visibleEnough) continue;
      const element = entry.target;
      const state = pending.get(element);
      if (!state) continue;
      observer.unobserve(element);
      if (reducedMotion.matches) {
        finish(element);
        continue;
      }
      const delay = Math.min(batch++ * STAGGER, MAX_DELAY);
      element.style.setProperty("--reveal-delay", `${delay}ms`);
      element.classList.add("is-revealed");
      // Remove reveal styling afterwards so existing hover transitions take over.
      state.timer = setTimeout(() => finish(element), DURATION + delay + 60);
    }
  // No negative rootMargin: content at the very bottom of the page must still be able to trigger.
  }, { threshold: [0, 0.12, 0.25] });

  const inViewport = element => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  };

  function register(element) {
    if (element.closest("[data-skeleton]")) return;
    // API-fed project content is registered once loading.js signals it is ready.
    if (document.documentElement.classList.contains("portfolio-loading") && element.closest("#work")) return;
    if (known.has(element)) return;
    known.add(element);
    // Back cards in the project stack are clipped, so they never "enter" the viewport;
    // their own rotation transition is their entrance.
    const card = element.closest(".rolling-card");
    if (card && card.dataset.position !== "0") return;
    // Closed <details> content is never reported as intersecting; the disclosure's
    // own open animation covers it instead.
    if (element.closest("details > :not(summary)")) return;
    if (reducedMotion.matches || element.matches('[role="status"], [role="alert"], .form-note')) return;
    // Avoid nested reveals and leave anything already being used fully visible.
    if (element.parentElement?.closest(".scroll-reveal") || element.contains(document.activeElement)) return;
    // Never hide something the visitor may already have seen painted (first load, or the
    // project area's own fade-in); only content still below the fold gets a reveal.
    if ((initialScan || element.closest(".portfolio-entering")) && inViewport(element)) return;
    pending.set(element, { timer: null });
    element.classList.add("scroll-reveal");
    observer.observe(element);
  }

  function scan(root) {
    if (root.nodeType === 1 && root.matches(selectors)) register(root);
    root.querySelectorAll(selectors).forEach(register);
  }

  scan(document);
  initialScan = false;
  document.addEventListener("portfolio:ready", () => scan(document), { once: true });
  new MutationObserver(records => {
    // API-fed projects, filtered cards and inbox messages.
    for (const element of pending.keys()) {
      if (!element.isConnected) finish(element);
    }
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) scan(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener("focusin", event => {
    let element = event.target;
    while (element?.nodeType === 1) {
      if (pending.has(element)) finish(element);
      element = element.parentElement;
    }
  });
  function revealAll() {
    for (const element of pending.keys()) finish(element);
  }
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) revealAll();
  });
  addEventListener("beforeprint", revealAll);
})();
