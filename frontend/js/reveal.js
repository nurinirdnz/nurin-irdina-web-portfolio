/* One-time scroll reveals shared by every page; content is visible without JS. */
(() => {
  "use strict";
  if (!("IntersectionObserver" in window)) return;

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const selectors = [
    ".hero-copy > *", ".profile-summary", ".section-heading",
    ".rolling-card-header", ".rolling-card .project-info > *",
    ".rolling-card .project-visual", ".rolling-footer", ".archive-heading",
    ".archive-item", ".experience-group > .subsection-title", ".experience-list > article", ".timeline > article",
    ".skill-card", "details > summary", ".detail-columns > div",
    ".about-grid > div", ".contact-grid > div", ".contact form > *",
    ".footer > *", "#dialog-content > *",
    ".admin-shell > .eyebrow", ".admin-shell > h1", "#login-form > *",
    ".toolbar", ".message",
  ].join(",");
  const known = new WeakSet();
  const pending = new Map();

  function finish(element) {
    const state = pending.get(element);
    if (state?.timer) clearTimeout(state.timer);
    element.classList.remove("scroll-reveal", "is-revealed");
    element.style.removeProperty("--reveal-delay");
    pending.delete(element);
    observer.unobserve(element);
  }

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.12) continue;
      const element = entry.target;
      const state = pending.get(element);
      if (!state) continue;
      observer.unobserve(element);
      if (reducedMotion.matches) {
        finish(element);
        continue;
      }
      element.classList.add("is-revealed");
      // Remove reveal styling afterwards so existing hover transitions take over.
      state.timer = setTimeout(() => finish(element), 500 + state.delay + 60);
    }
  }, { threshold: 0.12 });

  function register(element) {
    if (document.documentElement.classList.contains("portfolio-loading") || element.closest("[data-skeleton]")) return;
    if (known.has(element)) return;
    known.add(element);
    if (reducedMotion.matches || element.matches('[role="status"], [role="alert"], .form-note')) return;
    // Avoid nested reveals and leave anything already being used fully visible.
    if (element.parentElement?.closest(".scroll-reveal") || element.contains(document.activeElement)) return;
    // The loading fade handles the current viewport; offscreen content keeps its scroll reveal.
    if (document.querySelector(".portfolio-entering")) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) return;
    }
    const index = [...element.parentElement.children].indexOf(element);
    const delay = Math.min(Math.max(index, 0) * 70, 480);
    pending.set(element, { delay, timer: null });
    element.style.setProperty("--reveal-delay", `${delay}ms`);
    element.classList.add("scroll-reveal");
    observer.observe(element);
  }

  function scan(root) {
    if (root.nodeType === 1 && root.matches(selectors)) register(root);
    root.querySelectorAll(selectors).forEach(register);
  }

  scan(document);
  document.addEventListener("portfolio:ready", () => scan(document), { once: true });
  new MutationObserver(records => {
    // API-fed projects, filtered cards, dialog content and inbox messages.
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
