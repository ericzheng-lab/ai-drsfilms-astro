/* deep2.js — EZ-OS + Contact aliveness layer */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const SCRAMBLE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789@./';

  // Skip CJK / non-ASCII / control chars when scrambling
  const isScrambleSafe = (ch) => {
    const code = ch.charCodeAt(0);
    return code > 32 && code < 127 && ch !== ' ' && ch !== '.' && ch !== '/' && ch !== '@';
  };

  function scrambleText(el, duration, onDone) {
    if (reduceMotion) { if (onDone) onDone(); return; }
    const original = el.dataset.original || el.textContent;
    el.dataset.original = original;
    if (el.dataset.scrambling === '1') return;
    el.dataset.scrambling = '1';
    el.classList.add('is-scrambling');
    const start = performance.now();
    const chars = [...original];
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = chars.map((ch, i) => {
        if (!isScrambleSafe(ch)) return ch;
        if (i / chars.length < progress) return ch;
        return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      }).join('');
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = original;
        el.dataset.scrambling = '0';
        el.classList.remove('is-scrambling');
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(tick);
  }

  // 1. EZ-OS cursor parallax tilt
  function initEzosTilt() {
    const section = document.querySelector('section#ez-os');
    const svg = document.querySelector('#ez-os .ezos__svg');
    const layout = document.querySelector('#ez-os .ezos__layout');
    if (!section || !svg || !layout || !finePointer || reduceMotion) return;
    let raf = null;
    let tx = 0, ty = 0;
    section.addEventListener('pointermove', (e) => {
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const nx = (e.clientX - cx) / (rect.width / 2);
      const ny = (e.clientY - cy) / (rect.height / 2);
      tx = Math.max(-1, Math.min(1, nx));
      ty = Math.max(-1, Math.min(1, ny));
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      svg.classList.toggle('near-cursor', dist < 200 + rect.width / 2);
      if (!raf) raf = requestAnimationFrame(apply);
    });
    section.addEventListener('pointerleave', () => {
      tx = 0; ty = 0;
      svg.classList.remove('near-cursor');
      if (!raf) raf = requestAnimationFrame(apply);
    });
    function apply() {
      raf = null;
      svg.style.transform = `perspective(700px) rotateX(${(-ty * 6).toFixed(2)}deg) rotateY(${(tx * 6).toFixed(2)}deg)`;
      layout.style.transform = `perspective(900px) rotateX(${(ty * 1.5).toFixed(2)}deg) rotateY(${(-tx * 1.5).toFixed(2)}deg)`;
    }
  }

  // 2. EZ-OS node hover — light up edges + paired label
  function initEzosNodes() {
    const svg = document.querySelector('#ez-os .ezos__svg');
    if (!svg) return;
    const labels = [...svg.querySelectorAll('.label')];
    const closestLabel = (node) => {
      const cx = parseFloat(node.getAttribute('cx') || 0);
      const cy = parseFloat(node.getAttribute('cy') || 0);
      return labels.reduce((best, lbl) => {
        const d = Math.hypot(parseFloat(lbl.getAttribute('x')) - cx, parseFloat(lbl.getAttribute('y')) - cy);
        return (!best || d < best.d) ? { el: lbl, d } : best;
      }, null)?.el;
    };
    svg.querySelectorAll('.node').forEach((node) => {
      const label = closestLabel(node);
      node.addEventListener('pointerover', () => {
        svg.classList.add('edges-hot'); node.classList.add('is-hot');
        if (label) label.classList.add('label-hot');
      });
      node.addEventListener('pointerout', () => {
        svg.classList.remove('edges-hot'); node.classList.remove('is-hot');
        if (label) label.classList.remove('label-hot');
      });
    });
  }

  // 4. Contact link scramble
  function initContactLinks() {
    const links = document.querySelectorAll('section#contact .contact__link');
    links.forEach((link) => {
      link.addEventListener('pointerenter', () => scrambleText(link, 380));
    });
  }

  // 5. Section title scramble on reveal
  function initTitleScramble() {
    const titles = document.querySelectorAll('.section__title');
    if (!titles.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.dataset.scrambled) {
          entry.target.dataset.scrambled = '1';
          setTimeout(() => scrambleText(entry.target, 350), 120);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    titles.forEach((el) => io.observe(el));
  }

  // BONUS: Scroll progress line
  function initScrollProgress() {
    if (reduceMotion) return;
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    let raf = null;
    function update() {
      raf = null;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleY(${ratio.toFixed(4)})`;
    }
    window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  function boot() {
    initEzosTilt();
    initEzosNodes();
    initContactLinks();
    initTitleScramble();
    initScrollProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
