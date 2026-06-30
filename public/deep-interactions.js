/* ============ DEEP INTERACTIONS — 5 layers ============ */
(function () {
  "use strict";

  var fine = window.matchMedia("(pointer: fine)").matches;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var body = document.body;

  /* ---------- 1. CUSTOM CURSOR ---------- */
  if (fine) {
    var dot = document.createElement("div");
    dot.className = "cursor-dot";
    var ring = document.createElement("div");
    ring.className = "cursor-ring";
    document.documentElement.appendChild(dot);
    document.documentElement.appendChild(ring);
    body.classList.add("has-custom-cursor");

    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    var dx = mx, dy = my;

    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
    }, { passive: true });

    (function loop() {
      dx = mx; dy = my;
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      dot.style.transform = "translate3d(" + (dx - 3) + "px," + (dy - 3) + "px,0)";
      ring.style.transform = "translate3d(" + (rx - 14) + "px," + (ry - 14) + "px,0)" +
        (body.classList.contains("cursor-drag") ? " scale(1.3, 0.85)" : "");
      requestAnimationFrame(loop);
    })();

    var hoverSel = "a, button, [role='button'], .card__demo, .contact__link, .nav__links a, .stack__tool";
    document.addEventListener("pointerover", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) body.classList.add("cursor-hover");
      if (e.target.closest && e.target.closest(".card")) body.classList.add("cursor-drag");
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      if (e.target.closest && e.target.closest(hoverSel)) body.classList.remove("cursor-hover");
      if (e.target.closest && e.target.closest(".card")) body.classList.remove("cursor-drag");
    }, { passive: true });
  }

  /* ---------- 2. EZ-OS EDGE / NODE STAGGER ---------- */
  function initEzOs() {
    if (reduced) return;
    var edges = document.querySelectorAll(".ezos__svg .edge");
    edges.forEach(function (el, i) {
      el.style.animationDelay = (i * 0.4) + "s";
    });
    var nodes = document.querySelectorAll(".ezos__svg .node:not(.node--hub)");
    nodes.forEach(function (el, i) {
      el.style.animationDelay = (i * 0.5) + "s";
    });
  }

  /* ---------- 3. TOOLKIT LIGHTING ---------- */
  function initToolkit() {
    var rows = document.querySelectorAll(".stack__row");
    rows.forEach(function (row) {
      var tools = row.querySelectorAll(".stack__tool, .stack__sep");
      var timers = [];
      row.addEventListener("pointerenter", function () {
        timers.forEach(clearTimeout);
        timers = [];
        tools.forEach(function (t, i) {
          timers.push(setTimeout(function () { t.classList.add("lit"); }, i * 40));
        });
      });
      row.addEventListener("pointerleave", function () {
        timers.forEach(clearTimeout);
        timers = [];
        tools.forEach(function (t) { t.classList.remove("lit"); });
      });
    });
  }

  /* ---------- 4. MAGNETIC CTA ---------- */
  function initMagnetic() {
    if (!fine) return;

    function bindGroup(containerSel, targetSel, maxPull) {
      var container = document.querySelector(containerSel);
      if (!container) return;
      var targets = Array.from(container.querySelectorAll(targetSel));
      if (!targets.length) return;

      container.addEventListener("pointermove", function (e) {
        targets.forEach(function (btn) {
          var r = btn.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dxp = e.clientX - cx;
          var dyp = e.clientY - cy;
          var dist = Math.hypot(dxp, dyp);
          if (dist < 80) {
            var f = (1 - dist / 80);
            var pull = f * f * maxPull;
            var ang = Math.atan2(dyp, dxp);
            btn.style.transform = "translate3d(" +
              Math.cos(ang) * pull + "px," +
              Math.sin(ang) * pull + "px,0)";
          } else {
            btn.style.transform = "";
          }
        });
      }, { passive: true });

      container.addEventListener("pointerleave", function () {
        targets.forEach(function (b) { b.style.transform = ""; });
      }, { passive: true });
    }

    bindGroup(".built__grid", ".card__demo", 8);
    bindGroup(".contact", ".contact__link", 5);
  }

  /* ---------- 5. AI FILMS POSTER ANGLES ---------- */
  function initPosterAngles() {
    var tiles = document.querySelectorAll(".aifilm");
    var angles = [0, 72, 144, 216, 288];
    tiles.forEach(function (tile, i) {
      tile.style.setProperty("--angle", (angles[i % angles.length]) + "deg");
      var poster = tile.querySelector(".aifilm__poster");
      if (poster) poster.style.setProperty("--angle", (angles[i % angles.length]) + "deg");
    });
  }

  function init() {
    initEzOs();
    initToolkit();
    initMagnetic();
    initPosterAngles();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
