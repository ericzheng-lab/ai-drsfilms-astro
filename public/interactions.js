(() => {
  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const navLinks = document.querySelectorAll('.nav__links a');
  const navContainer = document.querySelector('.nav__links');
  if (navContainer && navLinks.length) {
    const indicator = document.createElement('span');
    indicator.className = 'nav__scrub';
    navContainer.appendChild(indicator);
    const moveTo = (el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const pr = navContainer.getBoundingClientRect();
      indicator.style.transform = `translateX(${r.left - pr.left}px)`;
      indicator.style.width = `${r.width}px`;
      indicator.style.opacity = '1';
    };
    navLinks.forEach((a) => {
      a.addEventListener('mouseenter', () => moveTo(a));
      a.addEventListener('focus', () => moveTo(a));
    });
    navContainer.addEventListener('mouseleave', () => {
      const active = navContainer.querySelector('a.is-active') || navLinks[0];
      moveTo(active);
    });
    const sections = [...document.querySelectorAll('section[id]')];
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
        moveTo(navContainer.querySelector('a.is-active'));
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  if (!prefersReduced) {
    document.querySelectorAll('.card').forEach((card) => {
      if (!card.querySelector('.card__inner')) {
        const inner = document.createElement('div');
        inner.className = 'card__inner';
        while (card.firstChild) inner.appendChild(card.firstChild);
        card.appendChild(inner);
      }
      const inner = card.querySelector('.card__inner');
      let raf = 0;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          card.style.transform = `perspective(900px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
          inner.style.transform = `translate3d(${-x * 6}px, ${-y * 6}px, 0)`;
        });
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
        inner.style.transform = '';
      });
    });
  }

  document.querySelectorAll('.stack__row').forEach((row) => {
    const phase = row.querySelector('.stack__phase');
    if (!phase) return;
    const real = phase.textContent.trim();
    let timer = 0;
    row.addEventListener('mouseenter', () => {
      if (prefersReduced) return;
      let i = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        if (i++ >= 3) { clearInterval(timer); phase.textContent = real; return; }
        phase.textContent = String(Math.floor(Math.random() * 90 + 10));
      }, 70);
    });
    row.addEventListener('mouseleave', () => { clearInterval(timer); phase.textContent = real; });
  });

  document.querySelectorAll('.aifilm').forEach((tile) => {
    const num = tile.querySelector('.aifilm__num');
    if (!num) return;
    const text = num.textContent.trim();
    num.innerHTML = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'aifilm__char';
      s.style.setProperty('--i', i);
      s.textContent = ch;
      num.appendChild(s);
    });
  });

  if (!prefersReduced && matchMedia('(pointer: fine)').matches) {
    const halo = document.createElement('div');
    halo.className = 'cursor-halo';
    document.body.appendChild(halo);
    let hx = 0, hy = 0, tx = 0, ty = 0, hraf = 0;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; if (!hraf) tick(); });
    const tick = () => {
      hx += (tx - hx) * 0.15;
      hy += (ty - hy) * 0.15;
      halo.style.transform = `translate3d(${hx - 300}px, ${hy - 300}px, 0)`;
      if (Math.abs(tx - hx) > 0.4 || Math.abs(ty - hy) > 0.4) hraf = requestAnimationFrame(tick);
      else hraf = 0;
    };
  }
})();
