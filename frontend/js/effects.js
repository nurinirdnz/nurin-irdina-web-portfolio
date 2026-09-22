/* Scroll reveal, mobile navigation and active-section tracking. Dependency-free. */
document.addEventListener(
  "portfolio-ready",
  () => {
    "use strict";
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const header = document.querySelector(".header");
    const nav = document.querySelector("#main-nav");
    const menuToggle = document.querySelector("#menu-toggle");

    const reveals = document.querySelectorAll(".reveal");
    if (reduced.matches || !("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }),
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      reveals.forEach((el) => io.observe(el));
    }

    function closeNav() {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
    if (nav && menuToggle) {
      menuToggle.addEventListener("click", () => {
        const open = nav.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(open));
      });
      nav.addEventListener("click", (event) => {
        if (event.target.closest("a")) closeNav();
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeNav();
      });
      document.addEventListener("click", (event) => {
        if (!nav.classList.contains("open")) return;
        if (nav.contains(event.target) || menuToggle.contains(event.target))
          return;
        closeNav();
      });
    }

    if (nav && "IntersectionObserver" in window) {
      const links = [...nav.querySelectorAll('a[href^="#"]')]
        .map((link) => ({
          link,
          section: document.querySelector(link.getAttribute("href")),
        }))
        .filter((entry) => entry.section);
      if (links.length) {
        const spy = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              const match = links.find((l) => l.section === entry.target);
              if (!match || !entry.isIntersecting) return;
              links.forEach((l) => l.link.removeAttribute("aria-current"));
              match.link.setAttribute("aria-current", "page");
            });
          },
          { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
        );
        links.forEach((entry) => spy.observe(entry.section));
      }
    }

    if (header) {
      const onScroll = () => header.classList.toggle("scrolled", scrollY > 8);
      addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  },
  { once: true },
);
