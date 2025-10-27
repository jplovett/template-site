// src/index.js
import "bootstrap";
import settings from '../config/settings.js';
import navRoutes from "../config/navRoutes.js";
import { buildHeader, buildFooter } from "./app.js"
const snipCache = new Map();

/* ---------- Snip loading / caching ---------- */
async function fetchSnip(path) {
    if (snipCache.has(path)) return snipCache.get(path);
    try {
        const resp = await fetch(path, { cache: "no-store" });
        if (!resp.ok) throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
        const html = await resp.text();
        snipCache.set(path, html);
        return html;
    } catch (err) {
        console.error("Error loading snip:", path, err);
        return `<div class="alert alert-danger p-2">Error loading ${path}</div>`;
    }
}

async function buildColNode(colDef) {
    const { cols = 12, snip } = colDef;
    const col = document.createElement("div");
    col.className = `col-12 col-md-${cols} mb-3`;
    col.innerHTML = `<div class="spinner-border text-secondary" role="status" aria-hidden="true"></div>`;
    const snipHtml = await fetchSnip(snip);
    col.innerHTML = snipHtml;
    return col;
}

/* ---------- View injection (unchanged core) ---------- */
export async function injectView(viewKey) {
    const route = navRoutes[viewKey] || navRoutes.home;
    const main = document.getElementById("mainApp");
    if (!main) {
        console.error("injectView: #mainApp element not found in DOM");
        return;
    }
    main.innerHTML = "";

    const container = document.createElement("div");
    container.className = "container d-flex justify-content-around flex-wrap py-3";
    container.setAttribute("role", "main");
    container.setAttribute("aria-label", route.Title || viewKey);

    if (route.Title) {
        const heading = document.createElement("h1");
        heading.className = "w-100 mb-3";
        heading.textContent = route.Title;
        container.appendChild(heading);
    }

    for (const rowObj of route.rows || []) {
        const rowNode = document.createElement("div");
        rowNode.className = "row w-100 align-items-start mb-3";
        const rowKey = Object.keys(rowObj)[0];
        const rowValue = rowObj[rowKey];
        const colsDefs = Array.isArray(rowValue) ? rowValue : [rowValue];

        const colPromises = colsDefs.map(async (colDef) => {
            if (!colDef || typeof colDef.snip !== "string") {
                const fallback = document.createElement("div");
                fallback.className = "col-12 mb-3";
                fallback.innerHTML = `<div class="alert alert-warning p-2">Missing snip for row ${rowKey}</div>`;
                return fallback;
            }
            return await buildColNode(colDef);
        });

        const colNodes = await Promise.all(colPromises);
        colNodes.forEach((c) => rowNode.appendChild(c));
        container.appendChild(rowNode);
    }

    main.appendChild(container);
    // Keep nav active state in sync after successful injection
    setActiveNav(viewKey);
}

/* ---------- Helpers for routing and nav state ---------- */
function normalizeRouteKeyFromHref(href) {
    try {
        const url = new URL(href, location.origin);
        // Use first path segment as key: / => home, /about => about, /product/item => product
        const seg = url.pathname.split("/").filter(Boolean)[0];
        return seg || "home";
    } catch {
        return "home";
    }
}

function setActiveNav(activeKey) {
    // Remove .active from all .nav-link elements, then add to the matching one
    const navLinks = document.querySelectorAll("nav .nav-link");
    navLinks.forEach((link) => link.classList.remove("active"));
    // Find link by data-route or by href-derived key
    const selector = `nav .nav-link[data-view="${activeKey}"]`;
    let active = document.querySelector(selector);
    if (!active) {
        // fallback: match href first segment
        const candidates = document.querySelectorAll("nav .nav-link[href]");
        for (const a of candidates) {
            const key = normalizeRouteKeyFromHref(a.getAttribute("href"));
            if (key === activeKey) {
                active = a;
                break;
            }
        }
    }
    if (active) active.classList.add("active");
}

/* ---------- History API router and nav click handler ---------- */
function pushViewToHistory(viewKey, title) {
    const path = viewKey === "home" ? "/" : `/${viewKey}`;
    const state = { view: viewKey };
    // push state with title and friendly URL
    history.pushState(state, title || "", path);
}

function resolveViewFromLocation() {
    // Prefer state if present, otherwise derive from pathname
    const state = history.state;
    if (state && state.view) return state.view;
    const seg = location.pathname.split("/").filter(Boolean)[0];
    return seg || "home";
}

function onNavClick(e) {
    // Event delegation: only interested in .nav-link clicks
    const link = e.target.closest(".nav-link");
    if (!link || !document.querySelector("nav")) return;
    // Ignore clicks not inside the nav container
    if (!document.querySelector("nav").contains(link)) return;

    // If it's an external link (has target or origin different), let it proceed
    const href = link.getAttribute("href");
    const isExternal = link.target === "_blank" || (href && !href.startsWith("/") && !href.startsWith("#") && href.indexOf(location.origin) !== 0);
    if (isExternal) return; // allow default behavior

    e.preventDefault();

    // Resolve the view key: prefer data-route attribute, fallback to href path
    const viewKey = link.dataset.view ? link.dataset.view : normalizeRouteKeyFromHref(href);
    const title = (navRoutes[viewKey] && navRoutes[viewKey].Title) || viewKey;

    // Push into history and inject view
    pushViewToHistory(viewKey, title);
    injectView(viewKey);
}

/* Popstate handler to catch back/forward and inject previous view */
function onPopState() {
    const viewKey = resolveViewFromLocation();
    // Use injectView to update DOM and nav active state
    injectView(viewKey);
}

function applyMetaTags() {
    // Set document title
    document.title = settings.title;

    // Set meta description
    setOrCreateMeta('description', settings.description);

    // Set meta keywords
    setOrCreateMeta('keywords', settings.keywords);
}

function setOrCreateMeta(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
    }
    meta.content = content;
}
/* ---------- App bootstrap ---------- */
export function startApp() {
    buildHeader();
    // Ensure mainApp container exists
    if (!document.getElementById("mainApp")) {
        const fallback = document.createElement("main");
        fallback.id = "mainApp";
        document.body.appendChild(fallback);
    }

    // Attach a single delegated click listener to the document for nav clicks
    // using capture=false so normal event flow applies
    document.addEventListener("click", onNavClick, false);

    // Listen for browser navigation (back/forward)
    window.addEventListener("popstate", onPopState, { passive: true });

    // Initial render: derive view from location or state
    const initialView = resolveViewFromLocation();
    // Replace current state so that future popstate events have a state object
    history.replaceState({ view: initialView }, navRoutes[initialView]?.Title || "", initialView === "home" ? "/" : `/${initialView}`);

    // Render the initial view
    injectView(initialView);
    buildFooter();
    applyMetaTags();
}

if (document.readyState === 'complete') {
    startApp();
} else {
    window.addEventListener('load', startApp, { once: true });
}