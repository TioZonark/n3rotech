function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function sanitizeData(value, key = '') {
  if (Array.isArray(value)) return value.map(item => sanitizeData(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeData(childValue, childKey)]));
  }
  if (typeof value === 'string' && !['url', 'photo'].includes(key)) return escapeHTML(value);
  return value;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? escapeHTML(url.href) : '#link-bloqueado';
  } catch {
    return '#link-bloqueado';
  }
}

function safeAssetPath(value) {
  return typeof value === 'string' && /^assets\/[a-zA-Z0-9._/()-]+$/.test(value) ? escapeHTML(value) : '';
}

const data = sanitizeData(window.N3_DATA);
const el = (tag, cls, html = '') => {
  const node = document.createElement(tag);
  node.className = cls;
  node.innerHTML = html;
  return node;
};

const categoryRules = {
  'Setup gamer': p => ['SETUP GAMER', 'CONSOLE', 'CONTROLE', 'MOUSE GAMER', 'TECLADO GAMER', 'MONITOR GAMER'].includes(p.category),
  'Periféricos': p => ['MOUSE GAMER', 'TECLADO GAMER', 'CONTROLE', 'ACESSÓRIOS'].includes(p.category),
  'Áudio': p => p.category === 'ÁUDIO',
  'Smartwatches': p => ['SMARTWATCH', 'ACESSÓRIO'].includes(p.category),
  'Consoles': p => ['CONSOLE', 'CONTROLE', 'SETUP GAMER'].includes(p.category),
  'Casa inteligente': p => p.category === 'CASA INTELIGENTE',
  'Custo-benefício': p => ['Redmi Watch 5 Lite', 'Pulseira Milanese magnética', 'Echo Dot 5ª geração', 'QCY T13', 'Suporte para controle PS5', 'Controle sem fio para PS4 e PC', 'Base cooler para notebook'].includes(p.name)
};

let activeCategory = null;
let observer;

function stars(rating) {
  return `<span class="stars">★★★★★</span><b>${rating.toFixed(1)}</b>`;
}

function productsFor(category) {
  return category && categoryRules[category] ? data.products.filter(categoryRules[category]) : data.products;
}

function renderFilterStatus(total) {
  let status = document.querySelector('#product-filter-status');
  if (!status) {
    status = el('div', 'product-filter-status');
    document.querySelector('#product-grid').before(status);
  }
  if (!activeCategory) {
    status.hidden = true;
    status.innerHTML = '';
    return;
  }
  status.hidden = false;
  status.innerHTML = `<div><span>FILTRO ATIVO</span><strong>${activeCategory}</strong><small>${total} ${total === 1 ? 'produto encontrado' : 'produtos encontrados'}</small></div><button type="button" id="clear-filter">Limpar filtro ×</button>`;
  status.querySelector('#clear-filter').addEventListener('click', clearCategoryFilter);
}

function renderProducts(limit = 6, source = productsFor(activeCategory)) {
  const grid = document.querySelector('#product-grid');
  grid.innerHTML = '';
  source.slice(0, limit).forEach((p, index) => {
    const card = el('article', 'product-card reveal', `
      <div class="product-visual visual-${p.image}${p.photo ? ' has-photo' : ''}">
        <span class="card-badge">${p.badge}</span>
        ${p.photo && safeAssetPath(p.photo) ? `<img src="${safeAssetPath(p.photo)}" alt="${p.name}" loading="lazy">` : ''}
        <span class="product-shape" aria-hidden="true"></span>
      </div>
      <div class="product-body">
        <span class="product-category">${p.category}</span><h3>${p.name}</h3>
        <div class="rating">${stars(p.rating)}</div><p>${p.description}</p>
        <div class="product-bottom"><div><small>${p.price === 'Ver oferta' ? 'PREÇO NO ANÚNCIO' : 'PREÇO INFORMADO'}</small><strong>${p.price}</strong></div><a href="${safeExternalUrl(p.url)}" target="_blank" rel="sponsored nofollow noopener" aria-label="Ver ${p.name}">Ver produto <span>↗</span></a></div>
      </div>`);
    card.style.setProperty('--delay', `${index * 70}ms`);
    grid.append(card);
  });
  renderFilterStatus(source.length);
  observeReveals();
}

function setCategoryFilter(category) {
  activeCategory = category;
  const filtered = productsFor(category);
  renderProducts(filtered.length, filtered);
  document.querySelectorAll('.category-card').forEach(card => {
    const selected = card.dataset.category === category;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  document.querySelector('#show-more').parentElement.hidden = true;
  document.querySelector('#destaques').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearCategoryFilter() {
  activeCategory = null;
  renderProducts(6, data.products);
  document.querySelectorAll('.category-card').forEach(card => {
    card.classList.remove('selected');
    card.setAttribute('aria-pressed', 'false');
  });
  document.querySelector('#show-more').parentElement.hidden = false;
}

function renderTested() {
  const grid = document.querySelector('#tested-grid');
  data.tested.forEach((p, index) => grid.append(el('article', 'tested-card reveal', `
    <div class="tested-visual visual-${p.image}${p.photo ? ' has-photo' : ''}"><span class="tested-index">0${index + 1}</span>${p.photo && safeAssetPath(p.photo) ? `<img src="${safeAssetPath(p.photo)}" alt="${p.name}" loading="lazy">` : ''}<span class="product-shape"></span><span class="verdict-pill">✓ ${p.verdict}</span></div>
    <div class="tested-content"><span class="product-category">${p.tested ? 'TESTE REAL • LONGO PRAZO' : `ANÁLISE DE MERCADO • ${p.category.toUpperCase()}`}</span><h3>${p.name}</h3>
    <div class="points"><div><strong><span class="plus">+</span> Pontos positivos</strong>${p.pros.map(x => `<p>${x}</p>`).join('')}</div><div><strong><span class="minus">−</span> Ponto negativo</strong>${p.cons.map(x => `<p>${x}</p>`).join('')}</div></div>
    <div class="tested-bottom"><div class="big-score"><strong>${p.score}</strong><span>/10<br>NOTA EDITORIAL</span></div><a href="${safeExternalUrl(p.url)}" target="_blank" rel="sponsored nofollow noopener">Ver oferta <span>↗</span></a></div></div>`)));
}

function renderRealReview() {
  const r = data.realReview;
  const host = document.querySelector('#real-review');
  if (!host || !r) return;
  host.innerHTML = `<article class="real-review reveal"><div class="review-story"><span class="kicker">${r.label}</span><h2>Minha experiência com o <span>${r.product}</span>.</h2><p class="review-lead">“${r.title}”</p><div class="review-prose">${r.paragraphs.map(p => `<p>${p}</p>`).join('')}</div><button class="review-toggle" type="button" aria-expanded="false"><span>Ler experiência completa</span> <i>↓</i></button><blockquote>${r.verdict}</blockquote><div class="review-signature"><img src="assets/n3rotech-profile.jpg" alt="Foto de perfil da N3rotech"><div><strong>Relato N3rotech</strong><small>Opinião pessoal, sem enrolação</small></div></div></div><aside class="review-summary"><div class="review-product"><img src="${safeAssetPath(r.photo)}" alt="${r.product}" loading="lazy"><span class="verdict-pill">✓ TESTADO NO DIA A DIA</span></div><div class="review-score"><div><small>NOTA DA EXPERIÊNCIA</small><strong>8,8<span>/10</span></strong></div><div><small>PREÇO INFORMADO</small><b>${r.price}</b></div></div><div class="review-list positive"><h3><span>+</span> O que mais gostei</h3>${r.strengths.map(x => `<p>${x}</p>`).join('')}</div><div class="review-list caution"><h3><span>!</span> Pontos de atenção</h3>${r.cautions.map(x => `<p>${x}</p>`).join('')}</div><a class="button button-primary" href="${safeExternalUrl(r.url)}" target="_blank" rel="sponsored nofollow noopener">Ver oferta do relógio <span>↗</span></a><small class="affiliate-mini">Link de afiliado. O preço para você não muda.</small></aside></article>`;
  const review = host.querySelector('.real-review');
  const toggle = host.querySelector('.review-toggle');
  toggle.addEventListener('click', () => {
    const expanded = review.classList.toggle('review-expanded');
    toggle.setAttribute('aria-expanded', String(expanded));
    toggle.querySelector('span').textContent = expanded ? 'Mostrar resumo' : 'Ler experiência completa';
    toggle.querySelector('i').textContent = expanded ? '↑' : '↓';
  });
}

function renderCategories() {
  const grid = document.querySelector('#category-grid');
  data.categories.forEach((c, index) => {
    const count = productsFor(c.name).length;
    const card = el('button', `category-card reveal${index === 0 ? ' featured' : ''}`, `<span class="category-icon">${c.icon}</span><span><strong>${c.name}</strong><small>${count} ${count === 1 ? 'recomendação' : 'recomendações'}</small></span><i>→</i>`);
    card.type = 'button';
    card.dataset.category = c.name;
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => setCategoryFilter(c.name));
    grid.append(card);
  });
}

function renderQuick() {
  const grid = document.querySelector('#quick-grid');
  data.quickReviews.forEach((r, index) => grid.append(el('article', `quick-card reveal visual-${r.image}`, `<div class="quick-art visual-${r.image}${r.photo ? ' has-photo' : ''}"><span class="quick-number">0${index + 1}</span>${r.photo && safeAssetPath(r.photo) ? `<img src="${safeAssetPath(r.photo)}" alt="${r.product}" loading="lazy">` : ''}<span class="product-shape"></span><span class="quick-verdict">${r.verdict}</span></div><div class="quick-copy"><span>${r.category}</span><h3>“${r.title}”</h3><div><strong>${r.product}</strong><a href="${safeExternalUrl(r.url)}" target="_blank" rel="sponsored nofollow noopener">Ver produto <i>↗</i></a></div></div>`)));
}

function renderVideos() {
  const grid = document.querySelector('#video-grid');
  if (!grid || !data.videos?.length) return;
  data.videos.forEach((v, index) => grid.append(el('article', `video-card reveal visual-${v.image}`, `<a class="video-thumb visual-${v.image}${v.photo ? ' has-photo' : ''}" href="#video-${index}" aria-label="Assistir: ${v.title}">${v.photo && safeAssetPath(v.photo) ? `<img src="${safeAssetPath(v.photo)}" alt="${v.title}" loading="lazy">` : ''}<span class="play-button">▶</span><span class="duration">${v.time}</span><span class="product-shape"></span></a><span class="video-type">VÍDEO N3ROTECH</span><h3>${v.title}</h3><p>${v.views}</p>`)));
}

function observeReveals() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(x => x.classList.add('visible'));
    return;
  }
  observer ||= new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  }), { threshold: .12 });
  document.querySelectorAll('.reveal:not(.visible)').forEach(x => observer.observe(x));
}

renderProducts(6);
renderTested();
renderRealReview();
renderCategories();
renderQuick();
renderVideos();
observeReveals();

const showMore = document.querySelector('#show-more');
showMore.addEventListener('click', () => {
  renderProducts(data.products.length, data.products);
  showMore.parentElement.hidden = true;
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', open);
});
nav.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
});

const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 24), { passive: true });

// Movimento e microinterações. Respeita a preferência de acessibilidade do sistema.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.body.classList.add('page-ready');

const progressBar = el('div', 'scroll-progress');
progressBar.setAttribute('aria-hidden', 'true');
document.body.prepend(progressBar);

function updateScrollProgress() {
  const maximum = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maximum > 0 ? Math.min(scrollY / maximum, 1) : 0;
  progressBar.style.transform = `scaleX(${progress})`;
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

if (!reducedMotion) {
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  if (finePointer) {
    const glow = el('div', 'cursor-glow');
    glow.setAttribute('aria-hidden', 'true');
    document.body.append(glow);
    window.addEventListener('pointermove', event => {
      glow.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      glow.classList.add('active');
    }, { passive: true });

    const attachTilt = root => root.querySelectorAll('.product-card:not(.tilt-ready), .tested-card:not(.tilt-ready), .quick-card:not(.tilt-ready), .category-card:not(.tilt-ready)').forEach(card => {
      card.classList.add('tilt-ready');
      card.classList.add('tilt-card');
      card.addEventListener('pointermove', event => {
        const bounds = card.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - .5;
        const y = (event.clientY - bounds.top) / bounds.height - .5;
        card.style.setProperty('--tilt-x', `${(-y * 4).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 5).toFixed(2)}deg`);
        card.style.setProperty('--spot-x', `${((x + .5) * 100).toFixed(1)}%`);
        card.style.setProperty('--spot-y', `${((y + .5) * 100).toFixed(1)}%`);
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
    attachTilt(document);
    const productGrid = document.querySelector('#product-grid');
    if (productGrid) new MutationObserver(() => attachTilt(productGrid)).observe(productGrid, { childList: true });
  }

  const counters = [
    { node: document.querySelector('.trust-row div:nth-child(1) strong'), end: 120, prefix: '+', decimals: 0 },
    { node: document.querySelector('.trust-row div:nth-child(2) strong'), end: 100, suffix: '%', decimals: 0 },
    { node: document.querySelector('.trust-row div:nth-child(3) strong'), end: 4.9, decimals: 1, comma: true }
  ].filter(item => item.node);

  const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const start = performance.now();
    const duration = 1250;
    const animate = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counters.forEach(item => {
        const value = (item.end * eased).toFixed(item.decimals);
        item.node.textContent = `${item.prefix || ''}${item.comma ? value.replace('.', ',') : value}${item.suffix || ''}`;
      });
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    counterObserver.disconnect();
  }), { threshold: .5 });
  const trustRow = document.querySelector('.trust-row');
  if (trustRow) counterObserver.observe(trustRow);

  const hero = document.querySelector('.hero');
  if (hero && finePointer) {
    hero.addEventListener('pointermove', event => {
      const x = event.clientX / window.innerWidth - .5;
      const y = event.clientY / window.innerHeight - .5;
      hero.style.setProperty('--hero-x', `${x * 10}px`);
      hero.style.setProperty('--hero-y', `${y * 7}px`);
    }, { passive: true });
  }
}

document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', event => {
  const target = document.querySelector(a.getAttribute('href'));
  if (target) {
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  }
}));
