/* Louis Guichard, shared front-end logic. Data comes from assets/data.js */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var PROJECTS = window.PROJECTS || [];
  var GALLERIES = window.GALLERIES || {};

  /* ---------- shared navigation (single source) ---------- */
  var NAV = [
    { href: "work.html", label: "Work" },
    { href: "about.html", label: "About" },
    { href: "exhibitions.html", label: "Exhibitions" },
    { href: "press.html", label: "Press" },
    { href: "books.html", label: "Books" },
    { href: "contact.html", label: "Contact" }
  ];
  function buildNav() {
    var cur = location.pathname.split("/").pop() || "index.html";
    if (cur === "gallery.html") cur = "work.html"; // galleries live under Work
    var html = NAV.map(function (n) {
      return '<a href="' + n.href + '"' + (n.href === cur ? ' class="active"' : '') + '>' + n.label + '</a>';
    }).join("");
    document.querySelectorAll(".site-nav").forEach(function (nav) { nav.innerHTML = html; });
  }

  /* ---------- mobile nav toggle ---------- */
  function initNav() {
    var btn = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".site-nav");
    if (btn && nav) {
      btn.addEventListener("click", function () { nav.classList.toggle("open"); });
    }
  }

  /* ---------- reveal images on scroll ---------- */
  function revealOnScroll(selector) {
    var els = document.querySelectorAll(selector);
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- WORK INDEX ---------- */
  function renderWork() {
    var grid = document.getElementById("work-grid");
    if (!grid) return;
    PROJECTS.forEach(function (p) {
      var a = document.createElement("a");
      a.className = "index-item";
      a.href = "gallery.html?p=" + encodeURIComponent(p.slug);
      var img = document.createElement("img");
      img.src = p.cover;
      img.alt = p.title;
      img.loading = "lazy";
      img.decoding = "async";
      var ov = document.createElement("div");
      ov.className = "index-overlay";
      ov.innerHTML = '<span class="index-title">' + p.title + '</span>';
      a.appendChild(img);
      a.appendChild(ov);
      grid.appendChild(a);
    });
  }

  /* ---------- GALLERY ---------- */
  function getParam(name) {
    var m = new RegExp("[?&]" + name + "=([^&]+)").exec(location.search);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function renderGallery() {
    var wrap = document.getElementById("gallery");
    if (!wrap) return;
    var slug = getParam("p");
    var project = PROJECTS.filter(function (p) { return p.slug === slug; })[0];
    var imgs = GALLERIES[slug] || [];

    if (!project || !imgs.length) {
      location.replace("work.html");
      return;
    }

    document.title = project.title + " · " + (SITE.name || "");
    var h = document.getElementById("gallery-title");
    var s = document.getElementById("gallery-sub");
    if (h) h.textContent = project.title;
    if (s) s.textContent = project.subtitle || "";

    currentImages = imgs;
    imgs.forEach(function (im, i) {
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = im.src;
      img.alt = project.title + " " + (i + 1);
      img.loading = "lazy";
      img.decoding = "async";
      fig.addEventListener("click", function () { openLightbox(i); });
      fig.appendChild(img);
      wrap.appendChild(fig);
    });

    revealOnScroll("#gallery img");
    buildGalleryNav(slug);
  }

  function buildGalleryNav(slug) {
    var nav = document.getElementById("gallery-nav");
    if (!nav) return;
    var idx = PROJECTS.map(function (p) { return p.slug; }).indexOf(slug);
    var prev = PROJECTS[(idx - 1 + PROJECTS.length) % PROJECTS.length];
    var next = PROJECTS[(idx + 1) % PROJECTS.length];
    nav.innerHTML =
      '<a href="gallery.html?p=' + prev.slug + '">&larr; ' + prev.title + '</a>' +
      '<a href="work.html">All work</a>' +
      '<a href="gallery.html?p=' + next.slug + '">' + next.title + ' &rarr;</a>';
  }

  /* ---------- LIGHTBOX (dark slideshow) ---------- */
  var lb, lbImg, lbCount, currentImages = [], lbIndex = 0;
  function ensureLightbox() {
    if (lb) return;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML =
      '<button class="lb-btn lb-close" aria-label="Close">&times;</button>' +
      '<button class="lb-btn lb-prev" aria-label="Previous">&#8249;</button>' +
      '<div class="lb-stage"><img alt=""></div>' +
      '<button class="lb-btn lb-next" aria-label="Next">&#8250;</button>' +
      '<div class="lb-count"></div>';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lbCount = lb.querySelector(".lb-count");
    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-prev").addEventListener("click", function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector(".lb-next").addEventListener("click", function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener("click", function (e) {
      if (e.target === lb || (e.target.classList && e.target.classList.contains("lb-stage"))) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    });
  }
  function showImage() {
    var im = currentImages[lbIndex];
    if (!im) return;
    lbImg.classList.remove("ready");
    lbImg.onload = function () { lbImg.classList.add("ready"); };
    lbImg.src = im.src;
    if (lbImg.complete) lbImg.classList.add("ready");
    if (lbCount) lbCount.textContent = (lbIndex + 1) + " / " + currentImages.length;
  }
  function step(d) {
    if (!currentImages.length) return;
    lbIndex = (lbIndex + d + currentImages.length) % currentImages.length;
    showImage();
  }
  function openLightbox(index) {
    ensureLightbox();
    lbIndex = index;
    showImage();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ---------- image protection (deterrent, like Squarespace) ---------- */
  function initProtection() {
    document.addEventListener("contextmenu", function (e) {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    });
    document.addEventListener("dragstart", function (e) {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    });
  }

  /* ---------- inject brand/footer/socials from SITE ---------- */
  function hydrateChrome() {
    document.querySelectorAll("[data-site-name]").forEach(function (e) { e.textContent = SITE.name || ""; });
    document.querySelectorAll("[data-site-email]").forEach(function (e) {
      e.textContent = SITE.email || ""; e.href = "mailto:" + (SITE.email || "");
    });
    document.querySelectorAll("[data-ig]").forEach(function (e) { e.href = SITE.instagram || "#"; });
    document.querySelectorAll("[data-fb]").forEach(function (e) { e.href = SITE.facebook || "#"; });
    var yr = document.querySelector("[data-year]");
    if (yr) yr.textContent = new Date().getFullYear();
  }

  document.addEventListener("DOMContentLoaded", function () {
    hydrateChrome();
    buildNav();
    initNav();
    initProtection();
    renderWork();
    renderGallery();
  });
})();
