// Scroll and entrance animations. The page is fully usable without this file:
// nothing is hidden in CSS, GSAP only animates *from* an offset state.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = $('.nav');

  addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 30), { passive: true });

  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reduce) {
    document.documentElement.classList.add('no-pin');
    $$('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Split headings into words so they can rise in one by one.
  $$('.split').forEach((h) => {
    h.innerHTML = h.textContent.trim().split(/\s+/)
      .map((w) => `<span class="line" style="display:inline-block"><span>${w}</span></span>`).join(' ');
    gsap.from(h.querySelectorAll('.line > span'), {
      yPercent: 110, duration: .9, ease: 'power4.out', stagger: .06,
      scrollTrigger: { trigger: h, start: 'top 85%' },
    });
  });

  // Hero entrance.
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
  tl.from('.hero__title .line > span', { yPercent: 115, duration: 1.1, stagger: .12 })
    .from('.hero .lede, .hero .cta', { y: 24, opacity: 0, duration: .8, stagger: .1 }, '-=.7')
    .from('.island', { scale: .85, y: 60, opacity: 0, duration: 1.4, ease: 'expo.out' }, '-=1.1')
    .from('.ring', { scale: .6, opacity: 0, rotate: -90, duration: 1.4 }, '<')
    .from('.float-tag', { scale: 0, opacity: 0, duration: .6, stagger: .12, ease: 'back.out(2)' }, '-=.8');

  // Idle float and parallax for the island.
  gsap.to('.island', { y: -18, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
  gsap.to('.ring', { rotate: 360, duration: 60, ease: 'none', repeat: -1 });
  $$('.float-tag').forEach((t, i) => gsap.to(t, { y: i % 2 ? 10 : -10, duration: 2.4 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  gsap.to('.hero__art', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__copy', { yPercent: -12, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Generic reveals.
  $$('.reveal').filter((el) => !el.closest('.hero')).forEach((el) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  // Counters.
  $$('[data-count]').forEach((el) => {
    const o = { v: 0 };
    gsap.to(o, {
      v: +el.dataset.count, duration: 1.6, ease: 'power2.out',
      onUpdate: () => { el.textContent = Math.round(o.v); },
      scrollTrigger: { trigger: el, start: 'top 90%' },
    });
  });

  // Bento tiles and roadmap cards stagger in.
  ScrollTrigger.batch('.tile, .road__card', {
    start: 'top 88%',
    onEnter: (els) => gsap.from(els, { y: 60, opacity: 0, rotateX: -8, duration: .9, stagger: .1, ease: 'power3.out' }),
  });

  // Asset cards: animate each newly rendered grid.
  const grid = $('#grid');
  new MutationObserver(() => {
    gsap.fromTo(grid.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .015, ease: 'power2.out', overwrite: true });
  }).observe(grid, { childList: true });

  // Pinned horizontal gallery on wide screens, native swipe on small ones.
  const mm = gsap.matchMedia();
  mm.add('(min-width: 768px)', () => {
    const track = $('.hscroll__track');
    const dist = () => track.scrollWidth - innerWidth;
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.hscroll', pin: '.hscroll__pin', start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true },
    });
  });
  mm.add('(max-width: 767px)', () => {
    document.documentElement.classList.add('no-pin');
    return () => document.documentElement.classList.remove('no-pin');
  });

  // Footer wordmark slides with scroll.
  gsap.fromTo('.foot__word', { xPercent: 8 }, { xPercent: -8, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  // Pointer-only flourishes.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const glow = $('.cursor-glow');
    const gx = gsap.quickTo(glow, 'x', { duration: .6, ease: 'power3' });
    const gy = gsap.quickTo(glow, 'y', { duration: .6, ease: 'power3' });
    addEventListener('pointermove', (e) => { glow.classList.add('on'); gx(e.clientX); gy(e.clientY); });

    $$('.magnetic').forEach((el) => {
      const mx = gsap.quickTo(el, 'x', { duration: .4, ease: 'power3' });
      const my = gsap.quickTo(el, 'y', { duration: .4, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .25);
        my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });

    $$('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { rotateY: ((e.clientX - r.left) / r.width - .5) * 10, rotateX: -((e.clientY - r.top) / r.height - .5) * 10, duration: .4 });
      });
      el.addEventListener('pointerleave', () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: .6, ease: 'elastic.out(1, .5)' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
