const config = window.N3_GIVEAWAY_CONFIG || {};

const safeExternalUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
};

document.querySelectorAll('[data-config]').forEach(node => {
  const value = config[node.dataset.config];
  node.textContent = typeof value === 'string' && value.trim() ? value : 'A definir';
});

const formUrl = safeExternalUrl(config.formUrl);
const registrationsOpen = config.status === 'open' && Boolean(formUrl);

document.querySelectorAll('.giveaway-form-link').forEach(formButton => {
  if (registrationsOpen) {
    formButton.href = formUrl;
    formButton.target = '_blank';
    formButton.rel = 'noopener noreferrer';
    formButton.classList.remove('is-disabled');
    formButton.removeAttribute('aria-disabled');
    formButton.innerHTML = 'Fazer minha inscrição <span>↗</span>';
  } else {
    formButton.removeAttribute('href');
    formButton.setAttribute('aria-disabled', 'true');
    formButton.addEventListener('click', event => event.preventDefault());
  }
});

if (registrationsOpen) {
  document.querySelector('#giveaway-status').textContent = 'INSCRIÇÕES ABERTAS';
  document.querySelector('#giveaway-status').classList.add('is-open');
}

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton?.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
});
nav?.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
});

const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => header?.classList.toggle('scrolled', scrollY > 24), { passive: true });

const observer = new IntersectionObserver(entries => entries.forEach(entry => {
  if (!entry.isIntersecting) return;
  entry.target.classList.add('visible');
  observer.unobserve(entry.target);
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(node => observer.observe(node));
document.body.classList.add('page-ready');
