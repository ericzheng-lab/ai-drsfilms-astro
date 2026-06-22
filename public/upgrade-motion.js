/**
 * upgrade-motion.js
 * Enhanced reveal + stat counter for ai.drsfilms.com
 * No external deps. Works with existing .reveal / .is-visible pattern.
 * Drop this script at the bottom of <body>, replacing the existing inline script.
 */

(function () {
  'use strict';

  /* ── 1. Stat counter ──────────────────────────────────────────────
     Detects .stat__num text that is a number (with optional $, +, %).
     When the parent .reveal--stat becomes visible, counts up to target.
  ──────────────────────────────────────────────────────────────────── */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    // Parse prefix ($), numeric value, suffix (+, %, etc.)
    const match = raw.match(/^([^0-9]*)([0-9]+(?:\.[0-9]+)?)([^0-9]*)$/);
    if (!match) return; // non-numeric stat (e.g. "Sundance") — skip
    const prefix = match[1];
    const target = parseFloat(match[2]);
    const suffix = match[3];
    const isInt  = Number.isInteger(target);
    const duration = 1100; // ms
    const start = performance.now();

    function tick(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      el.textContent = prefix + (isInt ? Math.round(current) : current.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }


  /* ── 2. Stagger assigner ──────────────────────────────────────────
     Walks direct children of grid/list containers and assigns
     --stagger CSS custom property based on DOM index (capped at 5).
     Call once on page load; elements don't need to be visible yet.
  ──────────────────────────────────────────────────────────────────── */
  function assignStaggerToChildren(containerSelector) {
    document.querySelectorAll(containerSelector).forEach(function (container) {
      Array.from(container.children).forEach(function (child, i) {
        if (child.classList.contains('reveal') ||
            child.classList.contains('reveal--card') ||
            child.classList.contains('reveal--aff') ||
            child.classList.contains('reveal--stat')) {
          child.style.setProperty('--stagger', Math.min(i, 5));
        }
      });
    });
  }


  /* ── 3. IntersectionObserver ──────────────────────────────────────
     Handles all .reveal* elements.
     When a stat becomes visible, kicks off its counter animation.
  ──────────────────────────────────────────────────────────────────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything immediately
      document.querySelectorAll('[class*="reveal"]').forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    const io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.classList.add('is-visible');

          // Trigger counter if this is a stat wrapper
          if (el.classList.contains('reveal--stat')) {
            var numEl = el.querySelector('.stat__num');
            if (numEl) animateCounter(numEl);
          }

          io.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    // Observe every reveal variant (covers base .reveal + all --variants)
    document.querySelectorAll(
      '.reveal, .reveal--title, .reveal--card, .reveal--rule, .reveal--stat, .reveal--aff'
    ).forEach(function (el) {
      io.observe(el);
    });
  }


  /* ── 4. Boot ──────────────────────────────────────────────────────
     Assign stagger to known grid containers, then start observer.
  ──────────────────────────────────────────────────────────────────── */
  function init() {
    // Cards grid (WhatIBuilt)
    assignStaggerToChildren('.built__grid');
    // Film tiles
    assignStaggerToChildren('.films__grid');
    // Stats row
    assignStaggerToChildren('.track__stats');
    // Affiliation / stack rows
    assignStaggerToChildren('.stack__rows');

    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
