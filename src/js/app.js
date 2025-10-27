// src/js/header.js
import "bootstrap";
import settings from '../config/settings.js';
import navRoutes from "../config/navRoutes.js";
const toggler = document.createElement("button");
toggler.className = "navbar-toggler";
toggler.type = "button";
toggler.setAttribute("data-bs-toggle", "collapse");
toggler.setAttribute("data-bs-target", "#navbarCollapse");
toggler.setAttribute("aria-controls", "navbarCollapse");
toggler.setAttribute("aria-expanded", "false");
toggler.setAttribute("aria-label", "Toggle navigation");
toggler.innerHTML = `<span class="navbar-toggler-icon"></span>`;

const collapseDiv = document.createElement("div");
collapseDiv.className = "collapse navbar-collapse";
collapseDiv.id = "navbarCollapse";

const buildLeftHeader = () => {
    const div = document.createElement("div");
    div.className = "d-flex align-items-center site-brand";
    div.innerHTML = `
    <img src="${settings.thumbnail}" alt="thumb" class="brand-thumb me-2">
    <div class="brand-text">
      <div class="h5 mb-0 site-title">${settings.title}</div>
      <div class="small text-warning site-sub">${settings.subTitle}</div>
    </div>
  `;
    return div;
};

const buildNavLinks = (navObj) => {
    const ul = document.createElement("ul");
    ul.className = "navbar-nav ms-auto"; // push to right
    Object.keys(navObj).forEach((key) => {
        console.info(navObj[key].view);
        const item = navObj[key];
        const li = document.createElement("li");
        li.className = "nav-item";
        const a = document.createElement("a");
        a.className = "nav-link";
        if (item.data) a.dataset.data = JSON.stringify(item.data);
        a.textContent = item.Title;
        a.dataset.view = key;
        li.appendChild(a);
        ul.appendChild(li);
    });
    return ul;
};

// builds full header and injects into header#hdr element
export function buildHeader() {
    const hdr = document.querySelector("header#hdr");
    if (!hdr) throw new Error("header#hdr element not found");
    hdr.className="sticky-top bg-success"
    // container
    const container = document.createElement("div");
    container.className = "container px-3 bg-body-success ";

    // navbar skeleton (Bootstrap)
    const nav = document.createElement("nav");
    nav.className = "navbar navbar-expand-custom ";

    // left brand/header
    const brandLeft = buildLeftHeader();
    brandLeft.classList.add("navbar-brand");
    nav.appendChild(brandLeft);

    // toggler (for collapse under 999px)
    const toggler = document.createElement("button");
    toggler.className = "navbar-toggler ";
    toggler.type = "button";
    toggler.setAttribute("aria-expanded", "false");
    toggler.setAttribute("aria-label", "Toggle navigation");
    toggler.innerHTML = `<span class="navbar-toggler-icon"></span>`;
    toggler.addEventListener("click", () => {
        collapseDiv.classList.toggle("show");
    });
    nav.appendChild(toggler);

    // collapse container
    const collapseDiv = document.createElement("div");
    collapseDiv.className = "collapse navbar-collapse";

    // nav links
    const navLinks = buildNavLinks(navRoutes);
    console.log('navLinks:', navLinks);

    collapseDiv.appendChild(navLinks);

    nav.appendChild(collapseDiv);
    container.appendChild(nav);
    hdr.innerHTML = "";
    hdr.appendChild(container);
}

export function buildFooter() {
    const ftr = document.querySelector('footer#ftr');
    ftr.classList.add("bg-success");
    ftr.classList.add("fixed-bottom");
    const year = new Date().getFullYear();
    ftr.innerHTML = `<div class="container-fluid text-center p-2 mb-1 bg-success">
                     <span>&copy; ${year} Parcel App. All rights reserved.
                     </span></div>`;
}