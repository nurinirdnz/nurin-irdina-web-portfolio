/* Navigation is available independently of the portfolio API. */
(() => {
  "use strict";
  const header = document.querySelector(".header");
  const nav = document.querySelector("#main-nav");
  const menuToggle = document.querySelector("#menu-toggle");
  if (!nav || !menuToggle) return;
  function closeNav(restoreFocus = false) {
    nav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    if (restoreFocus) menuToggle.focus();
  }
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    if (open) nav.querySelector("a")?.focus();
  });
  nav.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    closeNav();
    const target = document.querySelector(link.getAttribute("href"));
    if (target) { target.tabIndex = -1; target.focus({ preventScroll: true }); }
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && nav.classList.contains("open")) closeNav(true);
  });
  for (const type of ["click", "focusin"]) document.addEventListener(type, event => {
    if (!nav.contains(event.target) && !menuToggle.contains(event.target)) closeNav();
  });
  matchMedia("(max-width: 800px)").addEventListener("change", () => closeNav());
  if ("IntersectionObserver" in window) {
    const links = [...nav.querySelectorAll('a[href^="#"]')].map(link => ({
      link, section: document.querySelector(link.getAttribute("href")),
    })).filter(entry => entry.section);
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const match = links.find(item => item.section === entry.target);
        if (!match) return;
        links.forEach(item => item.link.removeAttribute("aria-current"));
        match.link.setAttribute("aria-current", "location");
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    links.forEach(entry => spy.observe(entry.section));
  }
  if (header) {
    const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
