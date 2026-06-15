/* Louis Guichard — shared front-end logic. Data comes from assets/data.js */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var PROJECTS = window.PROJECTS || [];
  var GALLERIES = window.GALLERIES || {};

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
    var list = document.getElementById("work-list");
    if (!list) return;
    var bg = document.getElementById("work-bg");
    PROJECTS.forEach(function (p) {
      var a = document.createElement("a");
      a.className = "project-link";
      a.href = "gallery.html?p=" + encodeURIComponent(p.slug);
      a.innerHTML = '<span class="ptitle">' + p.title + '</span>' +
                    '<span class="psub">' + (p.subtitle || "") + '</span>';
      if (bg && p.cover) {
        a.addEventListener("mouseenter", function () {
          bg.style.backgroundImage = 'url("' + p.cover + '")';
          bg.classList.add("show");
        });
        a.addEventListener("mouseleave", function () { bg.classList.remove("show"); });
      }
      list.appendChild(a);
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

    document.title = project.title + " — " + (SITE.name || "");
    var h = document.getElementById("gallery-title");
    var s = document.getElementById("gallery-sub");
    if (h) h.textContent = project.title;
    if (s) s.textContent = project.subtitle || "";

    imgs.forEach(function (im, i) {
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = im.src;
      img.alt = project.title + " — " + (i + 1);
      img.loading = "lazy";
      img.decoding = "async";
      if (im.w && im.h) { img.width = im.w; img.height = im.h; }
      img.addEventListener("click", function () { openLightbox(im.src); });
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

  /* ---------- LIGHTBOX ---------- */
  var lb, lbImg;
  function ensureLightbox() {
    if (lb) return;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<span class="lb-close">&times;</span><img alt="">';
    document.body.appendChild(lb);
    lbImg = lb.querySelector("img");
    lb.addEventListener("click", closeLightbox);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLightbox(); });
  }
  function openLightbox(src) {
    ensureLightbox();
    lbImg.src = src;
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
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
    initNav();
    renderWork();
    renderGallery();
  });
})();
