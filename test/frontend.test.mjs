import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const script = readFileSync(new URL("../frontend/js/app.js", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../frontend/js/effects.js", import.meta.url), "utf8");
const seed = JSON.parse(readFileSync(new URL("../backend/seed/portfolio.json", import.meta.url), "utf8"));

// Small DOM boundary fake: tests exercise application event handlers and API
// payloads, not browser layout, native focus trapping, or CSS rendering.
function element() {
  const listeners = new Map(), attrs = {}, classes = new Set();
  return {
    innerHTML: "", textContent: "", dataset: {}, attrs, focused: false,
    classList: {
      add: (...names) => names.forEach(name => classes.add(name)),
      remove: (...names) => names.forEach(name => classes.delete(name)),
      contains: name => classes.has(name),
      toggle(name, force = !classes.has(name)) {
        if (force) classes.add(name); else classes.delete(name);
        return force;
      },
    },
    setAttribute: (name, value) => { attrs[name] = value; },
    getAttribute: name => attrs[name],
    removeAttribute: name => { delete attrs[name]; },
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    async emit(type, event = {}) {
      for (const fn of listeners.get(type) || []) await fn({ currentTarget: this, target: this, preventDefault() {}, ...event });
    },
    hasListener: type => listeners.has(type),
    focus() { this.focused = true; },
    closest() { return null; },
  };
}

function fixture(fetchPortfolio = async () => ({ ok: true, json: async () => seed })) {
  const selectors = ["#featured-grid", "#archive", "#archive-count", "#project-dialog", "#dialog-content", ".close-dialog", "#year", "#contact-form", "#form-status"];
  const nodes = Object.fromEntries(selectors.map(key => [key, element()]));
  const filters = ["all", "fullstack", "desktop"].map(filter => Object.assign(element(), { dataset: { filter } }));
  const document = Object.assign(element(), {
    body: element(), querySelector: selector => nodes[selector],
    querySelectorAll: () => filters,
  });
  const dialog = nodes["#project-dialog"];
  dialog.showModal = () => { dialog.open = true; };
  dialog.close = async () => { dialog.open = false; await dialog.emit("close"); };
  const submit = Object.assign(element(), { firstElementChild: element() });
  const form = nodes["#contact-form"];
  form.reportValidity = () => true;
  form.querySelector = () => submit;
  form.values = { name: " Visitor ", email: "visitor@example.com", message: "An internship opportunity for you." };
  form.reset = () => { form.wasReset = true; };
  const requests = [];
  let contactResponse = { ok: true, json: async () => ({ message: "Message saved." }) };
  const completion = runInNewContext(script, {
    document, AbortSignal,
    FormData: class { constructor(form) { this.values = form.values; } get(key) { return this.values[key]; } },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return url === "/api/portfolio" ? fetchPortfolio() : contactResponse;
    },
  });
  return { nodes, filters, document, completion, requests, submit, form, setContactResponse: value => { contactResponse = value; } };
}

test("featured work exposes API descriptions, stacks, and features with only supplied source URLs", async () => {
  const f = fixture(); await f.completion;
  const html = f.nodes["#featured-grid"].innerHTML;
  assert.equal((html.match(/class="project-card/g) || []).length, 3);
  assert.equal((html.match(/project-lead/g) || []).length, 1);
  assert.match(html, /resource-grounded assistant with citations/i);
  assert.match(html, /TensorFlow · Keras/);
  assert.match(html, /href="https:\/\/github.com\/nurinirdnz\/Jom-Dekan"/);
  assert.equal((html.match(/href=/g) || []).length, 1);
  assert.doesNotMatch(html, /<button[^>]*>(?:(?!<\/button>)[\s\S])*<a\b/);
  assert.equal(f.nodes["#archive-count"].textContent, "/ 4");
});

test("archive filters retain details and dialog returns focus to the activating control", async () => {
  const f = fixture(); await f.completion;
  await f.filters[2].emit("click");
  assert.match(f.nodes["#archive"].innerHTML, /PICKUPLA/);
  assert.doesNotMatch(f.nodes["#archive"].innerHTML, /Clinical Management/);
  assert.equal(f.filters[2].attrs["aria-pressed"], "true");
  await f.filters[1].emit("click");
  assert.match(f.nodes["#archive"].innerHTML, /PreYourLoveds!/);
  assert.doesNotMatch(f.nodes["#archive"].innerHTML, /PICKUPLA/);
  const opener = Object.assign(element(), { dataset: { project: "clinical" } });
  await f.document.emit("click", { target: { closest: () => opener } });
  assert.equal(f.nodes["#project-dialog"].open, true);
  assert.match(f.nodes["#dialog-content"].innerHTML, /Oracle SQL/);
  assert.equal(f.nodes[".close-dialog"].focused, true);
  await f.nodes[".close-dialog"].emit("click");
  assert.equal(f.nodes["#project-dialog"].open, false);
  assert.equal(opener.focused, true);
  assert.equal(f.document.body.classList.contains("modal-open"), false);
});

test("API text is escaped, unsafe URLs omitted, and new featured projects need no diagram", async () => {
  const data = structuredClone(seed);
  data.projects[0].name = '<img src=x onerror="alert(1)">';
  data.projects[0].url = "javascript:alert(1)";
  data.projects.push({ ...data.projects[1], id: "new-project", name: "New project" });
  const f = fixture(async () => ({ ok: true, json: async () => data })); await f.completion;
  const html = f.nodes["#featured-grid"].innerHTML;
  assert.doesNotMatch(html, /<img|javascript:|undefined/);
  assert.match(html, /&lt;img/);
  assert.match(html, /New project/);
});

test("project API failure provides recovery without disabling contact", async () => {
  const f = fixture(async () => { throw new Error("offline"); }); await f.completion;
  assert.match(f.nodes["#featured-grid"].innerHTML, /role="alert"/);
  assert.match(f.nodes["#featured-grid"].innerHTML, /explore my GitHub/);
  assert.equal(f.form.hasListener("submit"), true);
  await f.form.emit("submit");
  assert.equal(f.nodes["#form-status"].textContent, "Message saved.");
});

test("contact works while projects are pending, validates input, and preserves failed messages", async () => {
  let resolveProjects;
  const f = fixture(() => new Promise(resolve => { resolveProjects = resolve; }));
  assert.equal(f.form.hasListener("submit"), true);
  await f.form.emit("submit");
  const sent = f.requests.find(request => request.url === "/api/contact");
  assert.equal(JSON.parse(sent.options.body).name, "Visitor");
  assert.equal(f.form.wasReset, true);
  assert.equal(f.submit.disabled, false);
  f.form.wasReset = false;
  f.setContactResponse({ ok: false, json: async () => ({ error: "Please try again later." }) });
  await f.form.emit("submit");
  assert.equal(f.form.wasReset, false);
  assert.equal(f.nodes["#form-status"].textContent, "Please try again later.");
  f.form.values.message = "short";
  const count = f.requests.length;
  await f.form.emit("submit");
  assert.equal(f.requests.length, count);
  resolveProjects({ ok: true, json: async () => seed }); await f.completion;
});

test("mobile menu initializes without API events and supports keyboard entry and Escape", async () => {
  const nav = element(), toggle = element(), firstLink = element();
  nav.querySelector = () => firstLink;
  nav.contains = target => target === firstLink;
  toggle.contains = target => target === toggle;
  const document = Object.assign(element(), {
    querySelector: selector => ({ "#main-nav": nav, "#menu-toggle": toggle })[selector],
  });
  runInNewContext(navigation, { document, window: {}, matchMedia: () => ({ addEventListener() {} }) });
  await toggle.emit("click");
  assert.equal(toggle.attrs["aria-expanded"], "true");
  assert.equal(toggle.attrs["aria-label"], "Close navigation");
  assert.equal(firstLink.focused, true);
  await document.emit("keydown", { key: "Escape" });
  assert.equal(toggle.attrs["aria-expanded"], "false");
  assert.equal(toggle.attrs["aria-label"], "Open navigation");
  assert.equal(toggle.focused, true);
});
