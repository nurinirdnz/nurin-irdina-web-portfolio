/* UI composition and accessible interactions, intentionally dependency-free. */
(async () => {
  "use strict";
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const $ = (s) => document.querySelector(s);
  $("#year").textContent = new Date().getFullYear();
  $("#contact-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const from = String(data.get("email")).trim();
    const message = String(data.get("message")).trim();
    if (!name || message.length < 10) {
      $("#form-status").textContent =
        "Please add your name and a message of at least 10 characters.";
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.firstElementChild.textContent = "Sending…";
    $("#form-status").textContent = "Sending your message…";
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email: from, message }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to send. Please try again.");
      $("#form-status").textContent = result.message;
      form.reset();
    } catch (error) {
      $("#form-status").textContent =
        error.message || "Connection failed. Please try again.";
    } finally {
      submit.disabled = false;
      submit.firstElementChild.textContent = "Send message";
    }
  });

  let projects,
    loadError = false;
  try {
    const response = await fetch("/api/portfolio", {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Portfolio unavailable");
    const data = await response.json();
    projects = data.projects.map((p) =>
      Object.fromEntries(
        Object.entries(p).map(([k, v]) => [
          k,
          Array.isArray(v)
            ? v.map(escapeHTML)
            : typeof v === "string"
              ? escapeHTML(v)
              : v,
        ]),
      ),
    );
    projects.forEach((p) => {
      if (p.url && !p.url.startsWith("https://")) delete p.url;
    });
  } catch {
    projects = [];
    loadError = true;
  }
  // All values below are author-controlled local content, never user input.
  const node = (n, title, sub) =>
    `<div class="arch-node"><span>0${n}</span><div><strong>${title}</strong><small>${sub}</small></div></div>`;
  const diagram = (caption, ...nodes) =>
    `<div class="architecture">${nodes.map((n, i) => (i ? '<div class="arch-connector"></div>' : "") + n).join("")}</div><p class="arch-caption">${caption}</p>`;
  const previews = {
    jomdekan: diagram(
      "Simplified architecture overview.",
      node(1, "React + TypeScript", "Client interface"),
      node(2, "Node.js + Express", "REST API &amp; auth"),
      node(3, "PostgreSQL", "Resources, discussions, users"),
      node(4, "OpenAI Responses API", "AI summaries &amp; resource Q&amp;A"),
    ),
    fitwus: diagram(
      "Simplified request flow.",
      node(1, "React", "Wellness dashboard"),
      node(2, "Express + MySQL", "REST API &amp; data"),
      node(3, "LLM assistant", "Personalized guidance"),
    ),
    animals: diagram(
      "Simplified inference flow.",
      node(1, "Image input", "Upload &amp; preprocess"),
      node(2, "CNN model", "TensorFlow / Keras"),
      node(3, "Streamlit UI", "Prediction output"),
    ),
  };
  // Select highlights from API data; full capabilities remain in each dialog.
  const highlightIndexes = { jomdekan: [2, 3, 7], fitwus: [0, 2, 4], animals: [0, 1, 3] };
  const sourceLink = (p) => p.url
    ? `<a class="text-link" href="${p.url}" target="_blank" rel="noopener noreferrer" aria-label="${p.name} source on GitHub">GitHub <span aria-hidden="true">↗</span></a>`
    : "";
  const stackTags = (p) => p.stack.map(technology => `<span class="tech-tag">${technology}</span>`).join("");
  const featuredProjects = projects.filter((p) => p.featured);
  const featuredGrid = $("#featured-grid");
  featuredGrid.innerHTML = featuredProjects.length
    ? `<div class="rolling-projects" role="region" aria-roledescription="carousel" aria-label="Featured engineering projects">
        <div class="rolling-stage" aria-live="off">
          ${featuredProjects
            .map(
              (p, i) =>
                `<article id="project-${p.id}" class="project-card rolling-card" data-stack-card data-slide-index="${i}" data-position="${i}" aria-labelledby="title-${p.id}"${i ? ' aria-hidden="true"' : ""}>
                  <header class="rolling-card-header">
                    <span class="rolling-card-caption">${p.category}</span>
                    <span class="index" aria-hidden="true">0${i + 1}</span>
                  </header>
                  <div class="rolling-card-body">
                    <div class="project-info">
                      <h3 id="title-${p.id}">${p.name}</h3>
                      <p class="project-description">${p.description}</p>
                      <p class="project-stack"><span class="sr-only">Technologies: </span>${stackTags(p)}</p>
                      <ul class="project-features">${(highlightIndexes[p.id] || [0, 1, 2]).map(index => p.features[index]).filter(Boolean).map(f => `<li>${f}</li>`).join("")}</ul>
                      <div class="project-actions"><button class="button secondary" data-project="${p.id}" aria-label="View ${p.name} project details"${i ? ' tabindex="-1"' : ""}>Technical details <span aria-hidden="true">↗</span></button>${sourceLink(p)}</div>
                    </div>
                    ${previews[p.id] ? `<aside class="project-visual" aria-label="${p.name} system overview"><p class="eyebrow">SYSTEM OVERVIEW</p>${previews[p.id]}</aside>` : ""}
                  </div>
                </article>`,
            )
            .join("")}
        </div>
        <div class="rolling-footer">
          <div class="rolling-pagination" role="group" aria-label="Choose a featured project">
            ${featuredProjects.map((p, i) => `<button type="button" class="rolling-dot${i === 0 ? " active" : ""}" data-slide="${i}" aria-label="Show ${p.name}" aria-pressed="${i === 0}"><span></span></button>`).join("")}
          </div>
          <p class="rolling-status" aria-live="polite"><span>01</span> / 0${featuredProjects.length} · ${featuredProjects[0].name}</p>
          <div class="rolling-navigation" aria-label="Featured project navigation">
            <button type="button" class="rolling-control" data-direction="previous" aria-label="Previous featured project"><span aria-hidden="true">←</span></button>
            <button type="button" class="rolling-control" data-direction="next" aria-label="Next featured project"><span aria-hidden="true">→</span></button>
          </div>
        </div>
      </div>`
    : "";

  function setupRollingProjects() {
    const root = featuredGrid.querySelector?.(".rolling-projects");
    const cards = [...(featuredGrid.querySelectorAll?.("[data-stack-card]") || [])];
    const dots = [...(featuredGrid.querySelectorAll?.("[data-slide]") || [])];
    const status = featuredGrid.querySelector?.(".rolling-status");
    if (!root || cards.length < 2 || !status) return;
    let activeIndex = 0;
    let pointerStart = null;

    function showProject(nextIndex) {
      const focusWasInsideCard = cards.some(card =>
        card.dataset.position === "0" && card.contains?.(document.activeElement));
      activeIndex = (nextIndex + cards.length) % cards.length;
      cards.forEach((card, index) => {
        const position = (index - activeIndex + cards.length) % cards.length;
        const active = position === 0;
        card.dataset.position = String(position);
        card.setAttribute("aria-hidden", String(!active));
        card.querySelectorAll("a, button").forEach((control) => {
          if (active) control.removeAttribute("tabindex");
          else control.setAttribute("tabindex", "-1");
        });
      });
      dots.forEach((dot, index) => {
        const active = index === activeIndex;
        dot.classList.toggle("active", active);
        dot.setAttribute("aria-pressed", String(active));
      });
      status.innerHTML = `<span>0${activeIndex + 1}</span> / 0${cards.length} · ${featuredProjects[activeIndex].name}`;
      if (focusWasInsideCard) cards[activeIndex].querySelector("button, a")?.focus({ preventScroll: true });
    }

    featuredGrid.addEventListener("click", (event) => {
      const direction = event.target.closest?.("[data-direction]")?.dataset.direction;
      if (direction) {
        showProject(activeIndex + (direction === "next" ? 1 : -1));
        return;
      }
      const dot = event.target.closest?.("[data-slide]");
      if (dot) {
        showProject(Number(dot.dataset.slide));
        return;
      }
      const card = event.target.closest?.("[data-stack-card]");
      if (card && card.dataset.position !== "0")
        showProject(Number(card.dataset.slideIndex));
    });
    root.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      showProject(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
    });
    root.addEventListener("pointerdown", (event) => {
      if (event.target.closest?.("a, button")) return;
      pointerStart = event.clientX;
    });
    root.addEventListener("pointerup", (event) => {
      if (pointerStart === null) return;
      const distance = event.clientX - pointerStart;
      pointerStart = null;
      if (Math.abs(distance) > 55)
        showProject(activeIndex + (distance < 0 ? 1 : -1));
    });
    root.addEventListener("pointercancel", () => {
      pointerStart = null;
    });
    // Evidence links must reveal their project even when it is behind another card.
    document.addEventListener("click", (event) => {
      const link = event.target.closest?.('a[href^="#project-"]');
      if (!link) return;
      const index = featuredProjects.findIndex(project =>
        `#project-${project.id}` === link.getAttribute("href"));
      if (index < 0) return;
      showProject(index);
      cards[index].setAttribute("tabindex", "-1");
      cards[index].focus({ preventScroll: true });
    });
    showProject(0);
  }
  setupRollingProjects();
  if (loadError)
    $("#featured-grid").innerHTML =
      '<p role="alert">Projects could not load. Please refresh to try again, or <a class="text-link" href="https://github.com/nurinirdnz">explore my GitHub</a>.</p>';
  $("#archive-count").textContent = loadError ? "" : `/ ${projects.filter(p => !p.featured).length}`;
  function renderArchive(filter = "all") {
    $("#archive").innerHTML = projects
      .filter((p) => !p.featured && (filter === "all" || p.type === filter))
      .map(
        (p) =>
          `<article class="archive-item"><span class="index">0${projects.indexOf(p) + 1}</span><div><h4>${p.name}</h4><p>${p.description}</p><p class="archive-stack">${p.stack.join(" · ")}</p></div><button class="text-link" data-project="${p.id}" aria-label="View ${p.name} project details">Details <span aria-hidden="true">↗</span></button></article>`,
      )
      .join("");
  }
  renderArchive();
  document.querySelectorAll("[data-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((b) => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      renderArchive(button.dataset.filter);
    }),
  );
  const dialog = $("#project-dialog");
  let opener;
  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-project]");
    if (!card) return;
    const p = projects.find((p) => p.id === card.dataset.project);
    if (!p) return;
    opener = card;
    $("#dialog-content").innerHTML =
      `<p class="eyebrow">${p.category}</p><h2 id="dialog-title">${p.name}</h2><p>${p.description}</p><p class="project-stack">${stackTags(p)}</p><section class="case-section"><h3>Implementation</h3><p>${p.detail}</p></section><section class="case-section"><h3>Engineering features</h3><ul>${p.features.map((f) => `<li>${f}</li>`).join("")}</ul></section>${previews[p.id] ? `<section class="case-section"><h3>System overview</h3><div class="project-visual">${previews[p.id]}</div></section>` : ""}<section class="case-section"><h3>Technology &amp; architecture</h3><p>${p.tools}</p></section><section class="case-section"><h3>Skills demonstrated</h3><p>${p.skills}</p></section><div class="project-actions">${sourceLink(p)}</div>`;
    document.body.classList.add("modal-open", "dialog-open");
    dialog.showModal();
    dialog.scrollTop = 0;
    $(".close-dialog").focus();
  });
  $(".close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open", "dialog-open");
    opener?.focus();
  });
})();
