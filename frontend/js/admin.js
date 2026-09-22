"use strict";
const $ = (s) => document.querySelector(s);
let page = 1,
  pages = 1;
async function api(path, options = {}) {
  const response = await fetch("/api/admin" + path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) showLogin();
    throw new Error(data.error || "Request failed.");
  }
  return data;
}
function showLogin() {
  $("#login-panel").hidden = false;
  $("#inbox-panel").hidden = true;
  $("#messages").replaceChildren();
}
function node(tag, text, className) {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
}
async function load() {
  try {
    const data = await api("/messages?page=" + page);
    pages = data.pages;
    $("#login-panel").hidden = true;
    $("#inbox-panel").hidden = false;
    $("#messages").replaceChildren();
    if (!data.messages.length)
      $("#messages").append(
        node("p", "No messages yet. New contact submissions will appear here."),
      );
    for (const message of data.messages) {
      const card = node("article", undefined, "message"),
        header = node("div", undefined, "message-header"),
        name = node("h3", message.name),
        badge = node("span", message.status, "badge");
      name.append(badge);
      header.append(name);
      const date = node("time", new Date(message.created_at).toLocaleString());
      date.dateTime = message.created_at;
      header.append(date);
      const email = node("a", message.email);
      email.href = "mailto:" + encodeURIComponent(message.email);
      const body = node("p", message.message, "message-body");
      const label = node("label", "Status"),
        select = node("select");
      select.setAttribute(
        "aria-label",
        "Status for message from " + message.name,
      );
      for (const value of ["new", "read", "archived"]) {
        const option = node("option", value);
        option.value = value;
        option.selected = value === message.status;
        select.append(option);
      }
      select.addEventListener("change", async () => {
        select.disabled = true;
        try {
          await api("/messages/" + encodeURIComponent(message.id), {
            method: "PATCH",
            body: JSON.stringify({ status: select.value }),
          });
          message.status = select.value;
          badge.textContent = select.value;
          $("#status").textContent = "Message updated.";
        } catch (e) {
          select.value = message.status;
          $("#status").textContent = e.message;
        } finally {
          select.disabled = false;
        }
      });
      label.append(select);
      card.append(header, email, body, label);
      $("#messages").append(card);
    }
    $("#page-label").textContent =
      `Page ${data.page} of ${pages} · ${data.total} messages`;
    $("#previous").disabled = page <= 1;
    $("#next").disabled = page >= pages;
  } catch (e) {
    $("#status").textContent = e.message;
  }
}
$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  try {
    await api("/login", {
      method: "POST",
      body: JSON.stringify({ password: $("#password").value }),
    });
    $("#password").value = "";
    $("#status").textContent = "Signed in.";
    page = 1;
    await load();
  } catch (e) {
    $("#status").textContent = e.message;
  } finally {
    button.disabled = false;
  }
});
$("#logout").addEventListener("click", async () => {
  try {
    await api("/logout", { method: "POST", body: "{}" });
    showLogin();
    $("#status").textContent = "Signed out.";
  } catch (e) {
    $("#status").textContent = e.message;
  }
});
$("#refresh").addEventListener("click", load);
$("#previous").addEventListener("click", () => {
  if (page > 1) {
    page--;
    load();
  }
});
$("#next").addEventListener("click", () => {
  if (page < pages) {
    page++;
    load();
  }
});
api("/session")
  .then(load)
  .catch(() => {
    $("#status").textContent = "Sign in to read messages from your portfolio.";
  });
