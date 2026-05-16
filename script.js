/* ═══════════════════════════════════════════════════════════════════════
   ZAMONA D'ORO · script.js
   ─────────────────────────────────────────────────────────────────────
   Architecture:
     1.  Boot & curtain reveal
     2.  Custom cursor
     3.  Magnetic buttons
     4.  Nav: scroll state + SPA routing
     5.  Reveal-on-scroll (IntersectionObserver)
     6.  Reveal words (hero title staggered)
     7.  Stats count-up
     8.  Hero parallax
     9.  Gallery: models, filters, selection
     10. Customizer: state, SVG render, price
     11. AI preview (Anthropic API placeholder + image fallback)
     12. Modal handling
     13. Easter egg (logo 5x)
     14. Newsletter form
═══════════════════════════════════════════════════════════════════════ */

'use strict';

/* ════════ 1. BOOT & CURTAIN ════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelector('.curtain').classList.add('is-open');
    document.body.classList.add('is-ready');
    // remove curtain from flow after animation
    setTimeout(() => {
      document.querySelector('.curtain').style.pointerEvents = 'none';
      document.querySelector('.curtain').style.display = 'none';
    }, 1600);
  }, 400);
});


/* ════════ 2. CUSTOM CURSOR ════════ */
(() => {
  const cursor = document.querySelector('.cursor');
  if (!cursor || matchMedia('(hover: none)').matches) return;

  const dot  = cursor.querySelector('.cursor__dot');
  const ring = cursor.querySelector('.cursor__ring');

  let mx = 0, my = 0;
  let rx = 0, ry = 0;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // ring follows with easing
  function loop() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  // hover affordance
  const hoverables = 'a, button, .chip, .filter, .swatch, .toggle__opt, .model-card, [data-route], [data-scroll]';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverables)) cursor.classList.add('is-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverables)) cursor.classList.remove('is-hover');
  });
})();


/* ════════ 3. MAGNETIC BUTTONS ════════ */
(() => {
  const magnets = document.querySelectorAll('.magnetic');
  magnets.forEach(m => {
    m.addEventListener('mousemove', e => {
      const r = m.getBoundingClientRect();
      const x = e.clientX - r.left - r.width  / 2;
      const y = e.clientY - r.top  - r.height / 2;
      m.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
    });
    m.addEventListener('mouseleave', () => {
      m.style.transform = '';
    });
  });
})();


/* ════════ 4. NAV: scroll + SPA routing ════════ */
(() => {
  const nav = document.getElementById('nav');
  const links = document.querySelectorAll('.nav__link');
  const homePage = document.getElementById('page-home');
  const atelierPage = document.getElementById('page-atelier');
  const burger = document.getElementById('navBurger');
  const linksWrap = document.querySelector('.nav__links');

  // scroll state
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // mobile burger
  burger.addEventListener('click', () => {
    burger.classList.toggle('is-open');
    linksWrap.classList.toggle('is-mobile-open');
  });

  // SPA-style routing
  function route(target, push = true) {
    if (target === 'atelier') {
      homePage.hidden = true;
      atelierPage.hidden = false;
      document.body.classList.remove('page--home');
      document.body.classList.add('page--atelier');
    } else {
      atelierPage.hidden = true;
      homePage.hidden = false;
      document.body.classList.add('page--home');
      document.body.classList.remove('page--atelier');
    }

    // update active state
    links.forEach(l => l.classList.toggle('is-active', l.dataset.route === target));

    // close mobile
    linksWrap.classList.remove('is-mobile-open');
    burger.classList.remove('is-open');

    // scroll
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (push) history.pushState({ route: target }, '', '#' + target);

    // re-trigger reveals on new page
    requestAnimationFrame(() => observeReveals());
  }

  document.querySelectorAll('[data-route]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      route(a.dataset.route);
    });
  });

  // smooth-scroll for in-page anchors
  document.querySelectorAll('[data-scroll]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href').slice(1);

      // if we're on atelier and target is on home, switch first
      const target = document.getElementById(id);
      if (target) {
        const onHome = !homePage.hidden;
        const onPage = (homePage.contains(target) && onHome) || (atelierPage.contains(target) && !onHome);
        if (!onPage && homePage.contains(target)) {
          route('home');
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 100);
        } else {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
      linksWrap.classList.remove('is-mobile-open');
      burger.classList.remove('is-open');
    });
  });

  window.addEventListener('popstate', e => {
    const r = e.state?.route || (location.hash === '#atelier' ? 'atelier' : 'home');
    route(r, false);
  });

  // initial route from hash
  if (location.hash === '#atelier') route('atelier', false);
})();


/* ════════ 5. REVEAL ON SCROLL ════════ */
let revealObserver = null;
function observeReveals() {
  if (revealObserver) revealObserver.disconnect();

  revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = parseInt(entry.target.dataset.revealDelay || 0, 10);
        setTimeout(() => entry.target.classList.add('is-revealed'), delay);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  document.querySelectorAll('.reveal:not(.is-revealed)').forEach(el => revealObserver.observe(el));
}
document.addEventListener('DOMContentLoaded', observeReveals);


/* ════════ 6. HERO WORD REVEAL ════════ */
window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.reveal-word').forEach(w => {
      const d = parseInt(w.dataset.revealDelay || 0, 10);
      setTimeout(() => w.classList.add('is-revealed'), d);
    });
  }, 1200);
});


/* ════════ 7. STATS COUNT-UP ════════ */
(() => {
  const statsSec = document.getElementById('stats');
  if (!statsSec) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statsSec.querySelectorAll('[data-count]').forEach(el => {
          const target = parseInt(el.dataset.count, 10);
          const dur = 1600;
          const start = performance.now();
          (function tick(now) {
            const t = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(tick);
          })(start);
        });
        observer.disconnect();
      }
    });
  }, { threshold: 0.4 });

  observer.observe(statsSec);
})();


/* ════════ 8. HERO PARALLAX ════════ */
(() => {
  const bg = document.querySelector('.hero__bg');
  if (!bg) return;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < 800) bg.style.transform = `translateY(${y * 0.3}px)`;
  }, { passive: true });
})();


/* ════════ 9. GALLERY: MODELS, FILTERS ════════ */
const MODELS = [
  {
    id: 'bibi-khanym', name: 'Bibi <em>Khanym</em>',
    type: 'clutch', meta: 'Pochette · Lapis & Oro Antico',
    img: 'images/royal-samarkand.png', basePrice: 4800,
    shape: 'clutch'
  },
  {
    id: 'veneziana', name: '<em>Veneziana</em> di Samarcanda',
    type: 'crossbody', meta: 'Crossbody · Bordeaux',
    img: 'images/golden-bukhara.png', basePrice: 5200,
    shape: 'crossbody'
  },
  {
    id: 'registan-royale', name: '<em>Registan</em> Royale',
    type: 'top', meta: 'Top-handle · Ikat & Crema',
    img: 'images/silk-road.png', basePrice: 4400,
    shape: 'top'
  },
  {
    id: 'hero-bag', name: '<em>Tamarini</em>',
    type: 'top', meta: 'Top-handle · Mogano',
    img: 'images/hero-bag.png', basePrice: 4600,
    shape: 'top'
  },
  {
    id: 'emerald', name: '<em>Smeraldo</em> di Margilan',
    type: 'tote', meta: 'Tote · Verde Smeraldo',
    img: 'images/bag-emerald.png', basePrice: 3900,
    shape: 'tote'
  },
  {
    id: 'mocha-ikat', name: '<em>Caravan</em> Mocha',
    type: 'top', meta: 'Top-handle · Cuoio & Ikat',
    img: 'images/bag-mocha-ikat.jpg', basePrice: 4200,
    shape: 'top'
  },
  {
    id: 'slate-tote', name: '<em>Ardesia</em>',
    type: 'tote', meta: 'Tote · Ardesia & Atlas',
    img: 'images/bag-slate.jpg', basePrice: 3500,
    shape: 'tote'
  },
  {
    id: 'tashkent-modern', name: '<em>Toshkent</em> Moderno',
    type: 'crossbody', meta: 'Crossbody · Nero traforato',
    img: 'images/modern-tashkent.png', basePrice: 4700,
    shape: 'crossbody'
  }
];

(() => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  MODELS.forEach((m, i) => {
    const card = document.createElement('article');
    card.className = 'model-card reveal';
    card.dataset.type = m.type;
    card.dataset.id = m.id;
    card.dataset.revealDelay = (i % 4) * 100;
    card.innerHTML = `
      <div class="model-card__media">
        <img src="${m.img}" alt="${m.name.replace(/<[^>]+>/g, '')}" />
        <div class="model-card__hover">Personalizza →</div>
      </div>
      <div class="model-card__caption">
        <h3 class="model-card__name">${m.name}</h3>
        <p class="model-card__meta">${m.meta}</p>
      </div>
    `;
    card.addEventListener('click', () => {
      document.querySelectorAll('.model-card').forEach(c => c.classList.remove('is-selected'));
      card.classList.add('is-selected');
      Customizer.loadModel(m);
      document.getElementById('customizer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    grid.appendChild(card);
  });

  // observe new reveals
  setTimeout(observeReveals, 50);

  // filters
  document.querySelectorAll('.filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const f = btn.dataset.filter;
      document.querySelectorAll('.model-card').forEach(c => {
        c.classList.toggle('is-hidden', f !== 'all' && c.dataset.type !== f);
      });
    });
  });
})();


/* ════════ 10. CUSTOMIZER ════════ */
const Customizer = (() => {
  const state = {
    modelId: 'bibi-khanym',
    modelName: 'Bibi Khanym',
    basePrice: 4800,
    shape: 'clutch',
    // pattern (Uzbek)
    pattern: 'suzane',
    patternColor: '#C9A961',
    patternSecondary: '#A0522D',
    placement: 'front',
    zardozi: 'off',
    accent: 'lapis',
    accentColor: '#1F3A5F',
    // leather (Italian)
    leatherType: 'vacchetta',
    leatherColor: 'cognac',
    leatherHex: '#8B5A2B',
    hardware: 'oro-antico',
    hardwareHex: '#C9A961',
    stitch: 'selleria',
    // detail
    lining: 'silk',
    monogram: '',
    wallet: 'off',
  };

  // price modifiers
  const ADDONS = {
    zardozi: { on: 800, off: 0 },
    stitch: { selleria: 600, macchina: 0, contrasto: 250 },
    lining: { silk: 400, suede: 200, cotton: 0 },
    wallet: { on: 350, off: 0 }
  };

  const LEATHER_COLORS = {
    nero: '#1A1612',
    cognac: '#8B5A2B',
    bordeaux: '#5C1B22',
    crema: '#EBE4D2',
    verde: '#2A3F2A'
  };

  const ACCENT_COLORS = {
    lapis: '#1F3A5F',
    terracotta: '#A0522D',
    emerald: '#1f4d3a',
    gold: '#C9A961'
  };

  const HARDWARE_HEX = {
    'oro-antico': '#C9A961',
    'argento':    '#C9CACC',
    'bronzo':     '#8B6F2F'
  };

  /* ─── Bag silhouette generators (SVG) ─── */
  // each returns the inner body path & details for a 600x600 viewBox
  // we share fill/pattern logic from outside
  const SHAPES = {
    tote: {
      body: `M 120 220 Q 120 200 140 200 L 460 200 Q 480 200 480 220 L 470 520 Q 468 540 448 540 L 152 540 Q 132 540 130 520 Z`,
      flap: ``,
      handles: `
        <path d="M 180 200 Q 180 100 230 100 Q 280 100 280 200" fill="none" stroke-width="8"/>
        <path d="M 320 200 Q 320 100 370 100 Q 420 100 420 200" fill="none" stroke-width="8"/>
      `,
      panel: `<rect x="220" y="240" width="160" height="280" />`,
      hardwareDots: `
        <circle cx="180" cy="200" r="5"/>
        <circle cx="280" cy="200" r="5"/>
        <circle cx="320" cy="200" r="5"/>
        <circle cx="420" cy="200" r="5"/>
      `
    },
    clutch: {
      body: `M 110 260 Q 110 240 130 240 L 470 240 Q 490 240 490 260 L 480 470 Q 478 490 458 490 L 142 490 Q 122 490 120 470 Z`,
      flap: `M 130 240 L 470 240 L 470 380 Q 470 400 450 400 L 150 400 Q 130 400 130 380 Z`,
      handles: ``,
      panel: `<rect x="180" y="260" width="240" height="120" />`,
      hardwareDots: `
        <rect x="290" y="385" width="20" height="30" />
        <circle cx="300" cy="400" r="4" fill="#1A1612"/>
      `
    },
    crossbody: {
      body: `M 130 240 Q 130 220 150 220 L 450 220 Q 470 220 470 240 L 460 510 Q 458 530 438 530 L 162 530 Q 142 530 140 510 Z`,
      flap: `M 150 220 L 450 220 L 450 360 Q 450 380 430 380 L 170 380 Q 150 380 150 360 Z`,
      handles: `
        <path d="M 150 240 Q 100 100 300 90 Q 500 100 450 240" fill="none" stroke-width="3"/>
      `,
      panel: `<rect x="200" y="240" width="200" height="120" />`,
      hardwareDots: `
        <rect x="285" y="365" width="30" height="25"/>
      `
    },
    top: {
      body: `M 125 230 Q 125 210 145 210 L 455 210 Q 475 210 475 230 L 465 525 Q 463 545 443 545 L 157 545 Q 137 545 135 525 Z`,
      flap: ``,
      handles: `
        <path d="M 240 210 Q 240 130 300 130 Q 360 130 360 210" fill="none" stroke-width="9"/>
      `,
      panel: `<rect x="210" y="250" width="180" height="270" />`,
      hardwareDots: `
        <rect x="290" y="320" width="20" height="14"/>
        <circle cx="240" cy="210" r="5"/>
        <circle cx="360" cy="210" r="5"/>
      `
    }
  };

  /* ─── Pattern definitions (SVG patterns) ─── */
  function patternDef(id, kind, c1, c2) {
    switch (kind) {
      case 'suzane':
        return `<pattern id="${id}" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <circle cx="30" cy="30" r="14" fill="none" stroke="${c1}" stroke-width="1.2"/>
          <circle cx="30" cy="30" r="6"  fill="none" stroke="${c1}" stroke-width="0.8"/>
          <circle cx="30" cy="30" r="2"  fill="${c2}"/>
          <path d="M30 6 L34 22 L30 30 L26 22 Z" fill="${c2}"/>
          <path d="M30 54 L34 38 L30 30 L26 38 Z" fill="${c2}"/>
          <path d="M6 30 L22 26 L30 30 L22 34 Z" fill="${c2}"/>
          <path d="M54 30 L38 26 L30 30 L38 34 Z" fill="${c2}"/>
        </pattern>`;
      case 'ikat':
        return `<pattern id="${id}" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q10 5 20 20 T 40 20" fill="none" stroke="${c1}" stroke-width="2"/>
          <path d="M0 30 Q10 15 20 30 T 40 30" fill="none" stroke="${c2}" stroke-width="1.5" opacity="0.7"/>
          <circle cx="20" cy="20" r="2" fill="${c1}"/>
        </pattern>`;
      case 'atlas':
        return `<pattern id="${id}" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="30" fill="${c1}"/>
          <rect x="9" width="3" height="30" fill="${c2}"/>
          <rect x="15" width="6" height="30" fill="${c1}" opacity="0.6"/>
          <rect x="24" width="3" height="30" fill="${c2}"/>
        </pattern>`;
      case 'bukhara':
        return `<pattern id="${id}" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M25 5 L45 25 L25 45 L5 25 Z" fill="none" stroke="${c1}" stroke-width="1"/>
          <path d="M25 15 L35 25 L25 35 L15 25 Z" fill="${c2}" opacity="0.6"/>
          <circle cx="25" cy="25" r="3" fill="${c1}"/>
        </pattern>`;
      case 'shahrisabz':
        return `<pattern id="${id}" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M0 25 L25 0 L50 25 L25 50 Z" fill="none" stroke="${c1}" stroke-width="1.2"/>
          <path d="M25 10 L40 25 L25 40 L10 25 Z" fill="none" stroke="${c2}" stroke-width="0.6"/>
          <circle cx="25" cy="25" r="2" fill="${c1}"/>
          <circle cx="0"  cy="25" r="2" fill="${c2}"/>
          <circle cx="50" cy="25" r="2" fill="${c2}"/>
          <circle cx="25" cy="0"  r="2" fill="${c2}"/>
          <circle cx="25" cy="50" r="2" fill="${c2}"/>
        </pattern>`;
    }
  }

  /* ─── Main render ─── */
  function render() {
    const wrap = document.getElementById('bagPreview');
    if (!wrap) return;

    const shape = SHAPES[state.shape] || SHAPES.clutch;
    const leatherFill = state.leatherHex;
    const hwHex = state.hardwareHex;
    const accent = state.accentColor;
    const isZardozi = state.zardozi === 'on';
    const stitchKind = state.stitch;
    const linerHex = state.lining === 'silk' ? '#EBE4D2' : (state.lining === 'suede' ? '#7A6852' : '#D6CDB6');

    // pattern color logic: pattern colors stay constant, but accent shows on rim
    const pattern = patternDef('zd-pattern', state.pattern, state.patternColor, isZardozi ? '#FFD27A' : state.patternSecondary);

    // placement: panel area or whole front
    let panelEl = '';
    if (state.placement === 'front')        panelEl = `<rect x="180" y="${state.shape==='clutch'?260:260}" width="240" height="${state.shape==='clutch'?120:240}" fill="url(#zd-pattern)" opacity="0.95"/>`;
    else if (state.placement === 'flap' && shape.flap)
      panelEl = `<path d="${shape.flap}" fill="url(#zd-pattern)" opacity="0.95"/>`;
    else if (state.placement === 'side')    panelEl = `
      <rect x="120" y="250" width="40" height="260" fill="url(#zd-pattern)" opacity="0.9"/>
      <rect x="440" y="250" width="40" height="260" fill="url(#zd-pattern)" opacity="0.9"/>
    `;
    else if (state.placement === 'handle')  panelEl = `<circle cx="300" cy="155" r="60" fill="url(#zd-pattern)" opacity="0.7"/>`;
    else panelEl = `<rect x="200" y="270" width="200" height="200" fill="url(#zd-pattern)" opacity="0.9"/>`;

    // stitching style
    let stitchStroke = `stroke="#000" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.3"`;
    if (stitchKind === 'selleria')  stitchStroke = `stroke="${isZardozi ? '#FFD27A' : hwHex}" stroke-width="1.2" stroke-dasharray="4 2" opacity="0.65"`;
    if (stitchKind === 'contrasto') stitchStroke = `stroke="${accent}" stroke-width="1.4" stroke-dasharray="5 3" opacity="0.85"`;

    // monogram
    const mono = state.monogram.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    const monoEl = mono
      ? `<text x="300" y="${state.shape==='clutch'?330:430}" text-anchor="middle"
              font-family="Italiana, Cormorant Garamond, serif" font-style="italic"
              font-size="34" fill="${hwHex}" letter-spacing="6"
              opacity="0.9">${mono.split('').join('·')}</text>`
      : '';

    // zardozi shimmer
    const zardoziEl = isZardozi
      ? `<rect x="180" y="${state.shape==='clutch'?260:260}" width="240" height="${state.shape==='clutch'?120:240}" fill="url(#zd-zardozi-glow)" opacity="0.4"/>`
      : '';

    // accent piping (top rim)
    const accentEl = `<path d="M 120 220 Q 120 200 140 200 L 460 200 Q 480 200 480 220" fill="none" stroke="${accent}" stroke-width="2.5" opacity="0.8"/>`;

    const svg = `
      <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${state.modelName} preview">
        <defs>
          ${pattern}
          <linearGradient id="leatherShade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stop-color="${leatherFill}" stop-opacity="0.92"/>
            <stop offset="50%"  stop-color="${leatherFill}" stop-opacity="1"/>
            <stop offset="100%" stop-color="${leatherFill}" stop-opacity="0.78"/>
          </linearGradient>
          <radialGradient id="zd-zardozi-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stop-color="#FFD27A" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#FFD27A" stop-opacity="0"/>
          </radialGradient>
          <filter id="leatherTexture">
            <feTurbulence baseFrequency="0.9" numOctaves="2" seed="3"/>
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"/>
            <feComposite in2="SourceGraphic" operator="in"/>
          </filter>
        </defs>

        <!-- soft drop shadow under bag -->
        <ellipse cx="300" cy="555" rx="200" ry="14" fill="#1A1612" opacity="0.18"/>

        <!-- body -->
        <path d="${shape.body}" fill="url(#leatherShade)"/>
        <path d="${shape.body}" fill="${leatherFill}" filter="url(#leatherTexture)" opacity="0.4"/>

        <!-- inner lining shadow at top -->
        <path d="M 130 215 L 470 215 L 470 240 L 130 240 Z" fill="${linerHex}" opacity="0.5"/>

        <!-- accent piping -->
        ${accentEl}

        <!-- pattern panel -->
        ${panelEl}

        <!-- zardozi shimmer over pattern -->
        ${zardoziEl}

        <!-- stitching (rect outline of body, approximated) -->
        <path d="${shape.body}" fill="none" ${stitchStroke}/>

        <!-- flap (drawn over panel if present, with own outline) -->
        ${shape.flap ? `<path d="${shape.flap}" fill="none" stroke="${hwHex}" stroke-width="0.6" opacity="0.5"/>` : ''}

        <!-- handles -->
        ${shape.handles ? `<g stroke="${leatherFill}" fill="${leatherFill}">${shape.handles.replace(/stroke-width="(\d+)"/g, 'stroke-width="$1"')}</g>` : ''}

        <!-- hardware -->
        <g fill="${hwHex}" stroke="${hwHex}">
          ${shape.hardwareDots}
        </g>

        <!-- monogram (gold or hardware-matching) -->
        ${monoEl}

        <!-- subtle brand mark bottom-right -->
        <text x="465" y="535" text-anchor="end"
              font-family="Cinzel, serif" font-size="10"
              fill="${hwHex}" letter-spacing="3" opacity="0.6">Z·O</text>
      </svg>
    `;
    wrap.innerHTML = svg;
  }

  /* ─── Price calculation ─── */
  function updatePrice() {
    let total = state.basePrice;
    total += ADDONS.zardozi[state.zardozi] || 0;
    total += ADDONS.stitch[state.stitch] || 0;
    total += ADDONS.lining[state.lining] || 0;
    total += ADDONS.wallet[state.wallet] || 0;
    if (state.monogram.trim()) total += 300;

    const fmt = total.toLocaleString('it-IT');
    const el = document.getElementById('priceAmount');
    if (el && el.textContent !== fmt) {
      el.classList.add('is-bumping');
      el.textContent = fmt;
      setTimeout(() => el.classList.remove('is-bumping'), 350);
    }

    // breakdown
    const bits = [];
    bits.push('Base €' + state.basePrice.toLocaleString('it-IT'));
    if (state.zardozi === 'on')      bits.push('Zardo\'zlik');
    if (state.stitch === 'selleria') bits.push('Selleria');
    if (state.lining === 'silk')     bits.push('Seta');
    if (state.monogram.trim())       bits.push('Monogramma');
    if (state.wallet === 'on')       bits.push('Portafoglio');
    const br = document.getElementById('priceBreakdown');
    if (br) br.textContent = bits.join(' · ');

    // ref code
    const refEl = document.getElementById('modelRef');
    if (refEl) {
      const code = `ZD–${state.modelId.split('-')[0].slice(0,3).toUpperCase()}–${state.pattern.slice(0,2).toUpperCase()}–${state.leatherColor.slice(0,2).toUpperCase()}`;
      refEl.textContent = code;
    }
  }

  /* ─── Wire up chips / swatches / toggles ─── */
  function wireGroup(rootSel) {
    document.querySelectorAll(rootSel).forEach(group => {
      const ctrl = group.dataset.control;
      group.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('button').forEach(b => b.classList.remove('is-active'));
          btn.classList.add('is-active');

          const val = btn.dataset.value;

          if (ctrl === 'pattern') {
            state.pattern = val;
            state.patternColor = btn.dataset.color || '#C9A961';
            state.patternSecondary = btn.dataset.secondary || '#A0522D';
          } else if (ctrl === 'leatherColor') {
            state.leatherColor = val;
            state.leatherHex = LEATHER_COLORS[val] || '#8B5A2B';
          } else if (ctrl === 'hardware') {
            state.hardware = val;
            state.hardwareHex = HARDWARE_HEX[val] || '#C9A961';
          } else if (ctrl === 'accent') {
            state.accent = val;
            state.accentColor = ACCENT_COLORS[val] || '#1F3A5F';
          } else {
            state[ctrl] = val;
          }

          render();
          updatePrice();
        });
      });
    });
  }

  function loadModel(model) {
    state.modelId = model.id;
    state.modelName = model.name.replace(/<[^>]+>/g, '');
    state.basePrice = model.basePrice;
    state.shape = model.shape;
    const nameEl = document.getElementById('modelName');
    if (nameEl) nameEl.innerHTML = model.name;
    render();
    updatePrice();
  }

  /* ─── Init ─── */
  function init() {
    wireGroup('.chips');
    wireGroup('.swatches');
    wireGroup('.toggle');

    const mono = document.getElementById('monogram');
    if (mono) {
      mono.addEventListener('input', e => {
        state.monogram = e.target.value;
        render();
        updatePrice();
      });
    }

    render();
    updatePrice();
  }

  return { init, loadModel, state, render };
})();

document.addEventListener('DOMContentLoaded', Customizer.init);


/* ════════ 11. AI PREVIEW (Anthropic API placeholder) ════════ */
(() => {
  const btn = document.getElementById('genAiBtn');
  const aiPreview = document.getElementById('aiPreview');
  const aiImg = document.getElementById('aiPreviewImg');
  const closeBtn = document.getElementById('aiPreviewClose');
  const shimmer = document.getElementById('renderShimmer');
  if (!btn) return;

  // === Anthropic API hook (placeholder) ===
  // To enable real AI generation, deploy a small backend proxy that:
  //   1. Receives the customizer state from this client
  //   2. Calls Anthropic /v1/messages with image_generation tool (if/when available)
  //      OR calls DALL-E / Replicate / Stable Diffusion with a constructed prompt
  //   3. Returns the resulting image URL
  // The browser cannot call Anthropic directly because of CORS + key safety.
  //
  // Example prompt construction below:

  function buildPrompt(s) {
    const placementMap = {
      front:  'on the front panel',
      flap:   'under the flap',
      side:   'on the side gussets',
      handle: 'around the handle base'
    };
    const patternMap = {
      suzane:     'classic Uzbek suzane embroidery in floral medallions',
      ikat:       'adras ikat pattern with diamond shapes',
      atlas:      'silk atlas striped pattern in warm tones',
      bukhara:    'Bukhara geometric medallion pattern',
      shahrisabz: 'Shahrisabz embroidery with star geometry'
    };
    return `Editorial luxury fashion photography of a ${s.modelName} handbag —
${s.leatherType} ${s.leatherColor} Italian leather with ${patternMap[s.pattern]}
${placementMap[s.placement]}, ${s.zardozi === 'on' ? 'highlighted with gold zardozi thread embroidery,' : ''}
${s.hardware} hardware, ${s.stitch} stitching, ${s.lining} lining.
On a dark walnut atelier table, soft directional light from the left,
Vogue Italia editorial style, 8k, photorealistic, no text, no logos.`;
  }

  // Placeholder: map current state to best-matching real image
  function pickFallbackImage(s) {
    // crude mapping: pattern + leather → closest hero shot in our library
    if (s.zardozi === 'on') {
      if (s.leatherColor === 'bordeaux') return 'images/golden-bukhara.png';
      if (s.leatherColor === 'cognac')   return 'images/hero-bag.png';
      return 'images/royal-samarkand.png';
    }
    if (s.pattern === 'ikat') {
      if (s.leatherColor === 'crema') return 'images/silk-road.png';
      if (s.leatherColor === 'verde') return 'images/bag-emerald.png';
      return 'images/bag-mocha-ikat.jpg';
    }
    if (s.pattern === 'atlas')     return 'images/collection-lineup.jpg';
    if (s.pattern === 'bukhara')   return 'images/golden-bukhara.png';
    if (s.pattern === 'shahrisabz')return 'images/royal-samarkand.png';
    return 'images/hero-bag.png';
  }

  async function generate() {
    shimmer.hidden = false;
    const prompt = buildPrompt(Customizer.state);
    console.log('[AI prompt]', prompt);

    // ─── REAL API CALL (replace this block for production) ───────────
    // const API_KEY = 'YOUR_KEY_HERE'; // ← never expose in client!
    // const res = await fetch('https://your-proxy.example.com/generate', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ prompt })
    // });
    // const { imageUrl } = await res.json();
    // ─────────────────────────────────────────────────────────────────

    // Fallback for demo: pick a curated image after a "thinking" delay
    await new Promise(r => setTimeout(r, 1800));
    const imageUrl = pickFallbackImage(Customizer.state);

    aiImg.src = imageUrl;
    aiImg.onload = () => {
      shimmer.hidden = true;
      aiPreview.hidden = false;
    };
  }

  btn.addEventListener('click', generate);
  closeBtn.addEventListener('click', () => { aiPreview.hidden = true; });
})();


/* ════════ 12. MODAL ════════ */
(() => {
  const modal   = document.getElementById('bookModal');
  const openBtn = document.getElementById('bookBtn');
  const closeBtn= document.getElementById('modalClose');
  const veil    = modal?.querySelector('.modal__veil');
  const form    = document.getElementById('bookForm');
  const success = document.getElementById('modalSuccess');

  if (!modal) return;

  function open() {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    success.hidden = true;
    form.hidden = false;
  }
  function close() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  veil?.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  form?.addEventListener('submit', e => {
    e.preventDefault();
    // In production, send via fetch to backend.
    form.hidden = true;
    success.hidden = false;
    setTimeout(() => { close(); form.reset(); }, 4000);
  });
})();


/* ════════ 13. EASTER EGG ════════ */
(() => {
  const logo = document.querySelector('.nav__logo');
  const egg  = document.getElementById('easterEgg');
  if (!logo || !egg) return;

  let clicks = 0;
  let resetTimer;
  logo.addEventListener('click', e => {
    if (e.target.closest('a') !== logo) return;
    clicks++;
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => clicks = 0, 2000);

    if (clicks >= 5) {
      clicks = 0;
      e.preventDefault();
      egg.hidden = false;
      egg.classList.add('is-open');

      // play a soft chord using Web Audio (no external file needed)
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const notes = [261.63, 329.63, 392.00, 523.25]; // C major
        notes.forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = f;
          o.type = 'sine';
          g.gain.value = 0;
          o.connect(g); g.connect(ctx.destination);
          o.start();
          const t = ctx.currentTime + i * 0.18;
          g.gain.linearRampToValueAtTime(0.12, t + 0.05);
          g.gain.linearRampToValueAtTime(0,    t + 1.6);
          o.stop(t + 1.8);
        });
      } catch (err) { /* silent fail */ }

      setTimeout(() => {
        egg.classList.remove('is-open');
        setTimeout(() => egg.hidden = true, 600);
      }, 3500);
    }
  });
})();


/* ════════ 14. NEWSLETTER FORM ════════ */
(() => {
  const form = document.getElementById('newsForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const input = form.querySelector('input');
    const btn = form.querySelector('button span');
    btn.textContent = '✓ Iscritta';
    input.value = '';
    setTimeout(() => { btn.textContent = 'Iscrivi'; }, 3000);
  });
})();
