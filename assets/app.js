/* Louis Guichard, shared front-end logic. Data comes from assets/data.js */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var PROJECTS = window.PROJECTS || [];
  var GALLERIES = window.GALLERIES || {};
  var SKETCHBOOK = window.SKETCHBOOK || [];

  /* ---------- shared navigation (single source) ---------- */
  var NAV = [
    { href: "work.html", label: "Work" },
    { href: "carnet.html", label: "Sketchbook" },
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

    // some series (polaroids) keep their own shape instead of the 3:2 grid crop
    if (project.layout) wrap.classList.add("gallery--" + project.layout);

    currentImages = imgs;
    imgs.forEach(function (im, i) {
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = im.thumb || im.src;
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

  /* ---------- SKETCHBOOK (carnet.html) ---------- */
  function renderSketchbook() {
    var track = document.getElementById("sb-track");
    if (!track || !SKETCHBOOK.length) return;
    var stage = document.getElementById("sb-stage");
    var strip = document.getElementById("sb-strip");
    var capEl = document.getElementById("sb-caption");
    var cntEl = document.getElementById("sb-count");
    var last = SKETCHBOOK.length - 1;
    var slides = [], frames = [], thumbs = [], index = 0;

    SKETCHBOOK.forEach(function (p, i) {
      var slide = document.createElement("div");
      slide.className = "sb-slide";
      var img = document.createElement("img");
      img.alt = "Sketchbook page " + (i + 1);
      img.decoding = "async";
      img.draggable = false;
      slide.appendChild(img);
      track.appendChild(slide);
      slides.push(img);
      frames.push(slide);

      var btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Page " + (i + 1));
      var th = document.createElement("img");
      th.src = p.thumb; th.alt = ""; th.loading = "lazy"; th.decoding = "async"; th.draggable = false;
      btn.appendChild(th);
      btn.addEventListener("click", function () { go(i); });
      strip.appendChild(btn);
      thumbs.push(btn);
    });

    // only the current spread and its neighbours are fetched
    function preload(i) {
      for (var k = i - 1; k <= i + 1; k++) {
        if (slides[k] && !slides[k].getAttribute("src")) slides[k].src = SKETCHBOOK[k].src;
      }
    }
    function go(i) {
      index = Math.max(0, Math.min(last, i));
      preload(index);
      frames.forEach(function (f, k) { f.classList.toggle("active", k === index); });
      if (capEl) capEl.textContent = SKETCHBOOK[index].caption || "";
      if (cntEl) cntEl.textContent = pad(index + 1) + " / " + pad(SKETCHBOOK.length);
      thumbs.forEach(function (b, k) { b.classList.toggle("active", k === index); });
      var b = thumbs[index];
      if (b && strip.scrollWidth > strip.clientWidth) {
        var max = strip.scrollWidth - strip.clientWidth;
        var to = b.offsetLeft - (strip.clientWidth - b.offsetWidth) / 2;
        glide(strip, Math.max(0, Math.min(max, to)));
      }
    }
    function pad(n) { return (n < 10 ? "0" : "") + n; }

    // hand-rolled smooth scroll: scroll-behavior isn't reliable everywhere
    var glideId = 0;
    function glide(el, to) {
      var from = el.scrollLeft, span = to - from, start = 0;
      cancelAnimationFrame(glideId);
      if (Math.abs(span) < 1) return;
      glideId = requestAnimationFrame(function tick(t) {
        if (!start) start = t;
        var p = Math.min(1, (t - start) / 420);
        el.scrollLeft = from + span * (1 - Math.pow(1 - p, 3));
        if (p < 1) glideId = requestAnimationFrame(tick);
      });
    }

    /* --- swipe: the gesture picks the page, the change itself is a fade --- */
    var tracking = false, dimming = false, startX = 0, startY = 0, dx = 0;

    stage.addEventListener("pointerdown", function (e) {
      if (e.button) return;
      tracking = true; dimming = false; dx = 0;
      startX = e.clientX; startY = e.clientY;
    });

    window.addEventListener("pointermove", function (e) {
      if (!tracking) return;
      var mx = e.clientX - startX, my = e.clientY - startY;
      if (!dimming) {
        if (Math.abs(mx) < 8 && Math.abs(my) < 8) return;
        if (Math.abs(my) > Math.abs(mx)) { endDrag(true); return; } // let the page scroll
        dimming = true;
        stage.classList.add("dragging");
        if (stage.setPointerCapture) { try { stage.setPointerCapture(e.pointerId); } catch (err) {} }
      }
      dx = mx;
    });

    function endDrag(cancel) {
      if (!tracking) return;
      tracking = false;
      stage.classList.remove("dragging");
      var moved = cancel ? 0 : dx;
      var threshold = Math.min(90, stage.clientWidth * .08);
      dx = 0;
      if (moved < -threshold) go(index + 1);
      else if (moved > threshold) go(index - 1);
    }
    window.addEventListener("pointerup", function () { endDrag(); });
    window.addEventListener("pointercancel", function () { endDrag(true); });

    // a click that didn't drag opens the full-size view
    stage.addEventListener("click", function (e) {
      if (e.target.closest(".sb-arrow")) return;
      if (Math.abs(e.clientX - startX) > 6 || Math.abs(e.clientY - startY) > 6) return;
      currentImages = SKETCHBOOK;
      openLightbox(index);
    });

    stage.querySelector(".sb-prev").addEventListener("click", function () { go(index - 1); });
    stage.querySelector(".sb-next").addEventListener("click", function () { go(index + 1); });

    document.addEventListener("keydown", function (e) {
      if (lb && lb.classList.contains("open")) return;
      if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "ArrowRight") go(index + 1);
    });

    go(0);
  }

  /* ---------- image protection (deterrent, like Squarespace) ---------- */
  function initProtection() {
    // Block the right-click / long-press menu over any photo or its cover layer.
    // We match images directly and the protected containers (gallery figures,
    // work index items, lightbox stage) so the menu is suppressed even when the
    // transparent overlay is the actual event target.
    function isProtected(el) {
      return !!(el && el.closest &&
        el.closest("img, figure, .index-item, .lb-stage, .lightbox"));
    }
    document.addEventListener("contextmenu", function (e) {
      if (e.target && (e.target.tagName === "IMG" || isProtected(e.target))) {
        e.preventDefault();
      }
    });
    document.addEventListener("dragstart", function (e) {
      if (e.target && e.target.tagName === "IMG") e.preventDefault();
    });
  }

  /* ---------- contact form (Web3Forms, no backend needed) ---------- */
  function initContactForm() {
    var form = document.getElementById("contact-form");
    if (!form) return;
    var status = document.getElementById("form-status");
    var btn = document.getElementById("contact-submit");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        if (form.reportValidity) form.reportValidity();
        return;
      }
      var key = (form.querySelector('[name="access_key"]') || {}).value || "";
      if (key.indexOf("YOUR_") === 0 || !key) {
        status.className = "form-status err";
        status.textContent = "The form isn't configured yet. Please email hello@louisguichard.com.";
        return;
      }
      var orig = btn.textContent;
      btn.disabled = true; btn.textContent = "Sending…";
      status.className = "form-status"; status.textContent = "";

      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success) {
            status.className = "form-status ok";
            status.textContent = "Thank you. Your message has been sent.";
            form.reset();
          } else {
            status.className = "form-status err";
            status.textContent = "Something went wrong. Please email hello@louisguichard.com.";
          }
        })
        .catch(function () {
          status.className = "form-status err";
          status.textContent = "Network error. Please email hello@louisguichard.com.";
        })
        .then(function () { btn.disabled = false; btn.textContent = orig; });
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
    initContactForm();
    renderWork();
    renderGallery();
    renderSketchbook();
  });
})();
