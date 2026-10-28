const BASE = 'assets/solarpunk/';
const CATS = ['All', 'Energy', 'Water & Garden', 'Props', 'Nature', 'Modular', 'Outdoor'];
const GALLERY = [
  ['01_featured', 'Solarpunk village built from the kit'],
  ['02_cottage', 'Modular cottage with solar roof'],
  ['03_night', 'Night scene with glowing lamps'],
  ['04_recolor', 'Autumn palette preset'],
  ['04b_winter', 'Winter palette preset with snow'],
  ['05_all_assets', 'All 60 assets'],
  ['06_lods', 'LOD0, LOD1 and LOD2 comparison'],
  ['07_godot', 'Godot 4 demo scene'],
];

const $ = (s) => document.querySelector(s);
const mv = $('#hero-mv');
const grid = $('#grid');
const state = { cat: 'All', q: '', palette: 'summer', current: 'fruit_tree' };
let assets = [];

if (matchMedia('(prefers-reduced-motion: reduce)').matches) mv.removeAttribute('auto-rotate');

// Palette swap: point the shared material at another atlas, keeping nearest-neighbour filtering
// so each 16 x 16 colour cell stays crisp.
const NEAREST = 9728;
async function applyPalette() {
  const info = mv.model?.materials.find((m) => m.name === 'SPK Palette')?.pbrMetallicRoughness.baseColorTexture;
  if (!info) return;
  const tex = await mv.createTexture(`${BASE}palettes/${state.palette}.png`);
  tex.sampler.setMagFilter(NEAREST);
  tex.sampler.setMinFilter(NEAREST);
  info.setTexture(tex);
}

mv.addEventListener('load', applyPalette);
mv.addEventListener('progress', (e) => {
  const bar = mv.querySelector('.mv-loading');
  bar.firstElementChild.style.width = `${e.detail.totalProgress * 100}%`;
  bar.style.opacity = e.detail.totalProgress >= 1 ? 0 : 1;
});

document.querySelectorAll('.swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.palette = btn.dataset.palette;
    document.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-checked', b === btn));
    applyPalette();
  });
});

function show(a, scroll) {
  state.current = a.slug;
  mv.src = `${BASE}glb/${a.slug}.glb`;
  mv.alt = `${a.name}, 3D model`;
  $('#hero-name').textContent = a.name;
  $('#hero-meta').textContent = `${a.cat} · ${a.tris.toLocaleString('en')} tris`;
  grid.querySelectorAll('.card').forEach((c) => c.setAttribute('aria-current', c.dataset.slug === a.slug));
  if (scroll) $('.viewer').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function renderChips() {
  const counts = Object.fromEntries(CATS.map((c) => [c, c === 'All' ? assets.length : assets.filter((a) => a.cat === c).length]));
  $('#chips').innerHTML = CATS.map((c) =>
    `<button class="chip" role="tab" aria-selected="${c === state.cat}" data-cat="${c}">${c}<small>${counts[c]}</small></button>`
  ).join('');
  $('#chips').querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    state.cat = b.dataset.cat;
    renderChips();
    renderGrid();
  }));
}

function renderGrid() {
  const q = state.q.trim().toLowerCase();
  const list = assets.filter((a) => (state.cat === 'All' || a.cat === state.cat) && (!q || a.name.toLowerCase().includes(q)));
  grid.innerHTML = list.map((a) => `
    <li><button class="card" data-slug="${a.slug}" aria-current="${a.slug === state.current}">
      <img src="${BASE}thumbs/${a.slug}.webp" alt="" loading="lazy" width="320" height="320">
      <b>${a.name}</b><span>${a.cat} · ${a.tris.toLocaleString('en')} tris</span>
    </button></li>`).join('');
  $('#empty').hidden = list.length > 0;
  grid.querySelectorAll('.card').forEach((c) => c.addEventListener('click', () => {
    show(assets.find((a) => a.slug === c.dataset.slug), true);
  }));
}

$('#q').addEventListener('input', (e) => { state.q = e.target.value; renderGrid(); });

// Gallery with a lightbox.
const box = $('#lightbox');
$('#gallery-list').innerHTML = GALLERY.map(([f, alt]) =>
  `<button data-src="${BASE}gallery/${f}.webp" aria-label="Open image: ${alt}"><img src="${BASE}gallery/${f}.webp" alt="${alt}" loading="lazy" width="1440" height="720"></button>`
).join('');
$('#gallery-list').querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
  $('#lightbox-img').src = b.dataset.src;
  $('#lightbox-img').alt = b.querySelector('img').alt;
  box.showModal();
}));
box.addEventListener('click', (e) => { if (e.target === box) box.close(); });

// Load the YouTube player only when asked.
$('#yt .yt__play').addEventListener('click', () => {
  const id = $('#yt').dataset.id;
  $('#yt').innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="Solarpunk Cozy Kit trailer" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
});

try {
  assets = await (await fetch(`${BASE}assets.json`)).json();
  renderChips();
  renderGrid();
  show(assets.find((a) => a.slug === state.current), false);
} catch {
  $('#empty').textContent = 'Could not load the asset list. Refresh to try again.';
  $('#empty').hidden = false;
}
