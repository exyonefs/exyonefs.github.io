---
title: 诗集
permalink: /poems/
icon: fas fa-scroll
order: 4
---

{% assign poems = site.poems | sort: 'date' | reverse %}
{% assign latest = poems | first %}

<style>
  /* LaTeX paper aesthetic: paper white / ink black / muted gray / hyperref blue, square corners, no shadows */
  #poems {
    --poems-serif: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "SimSun", Georgia, "Times New Roman", serif;
    max-width: 44rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 1.5rem;
    background: #FFFFFF;
    color: #111111;
    font-family: var(--poems-serif);
    font-size: 15px;
    line-height: 1.75;
  }

  /* The theme renders a bare title above tab pages; this page uses the centered document header instead */
  #main-wrapper h1.dynamic-title { display: none; }

  /* The theme forces sans-serif headings; restore serif for the paper feel (tight tracking mimics Computer Modern) */
  #poems h1,
  #poems h2,
  #poems h3 {
    font-family: var(--poems-serif);
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #111111;
  }

  #poems a {
    color: #0B5394;
    text-decoration: none;
    border-bottom: none;
  }
  #poems a:hover,
  #poems a:focus {
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  #poems a:focus-visible,
  #poems button:focus-visible {
    outline: 1px solid #111111;
    outline-offset: 2px;
  }

  .poems-title { font-size: 1.875rem; }
  .poems-muted { color: #6B6B66; }

  /* Buttons: square, flat, no shadow, no gradient */
  #poems .poems-btn {
    font-family: var(--poems-serif);
    font-size: .82rem;
    line-height: 1;
    padding: .45rem .75rem;
    border: 1px solid #111111;
    border-radius: 0;
    background: #FFFFFF;
    color: #111111;
    cursor: pointer;
    transition: background-color .2s, color .2s;
  }
  #poems .poems-btn:hover:not(:disabled),
  #poems .poems-btn:active:not(:disabled) { background: #F5F5F0; }
  #poems .poems-btn.is-active { background: #111111; color: #FFFFFF; }
  #poems .poems-btn.is-active:hover { background: #FFFFFF; color: #111111; }
  #poems .poems-btn:disabled { color: #6B6B66; border-color: #D4D4D0; cursor: default; }

  /* Pagination: without JS every entry stays visible */
  #poem-catalogue.is-paged .poem-item { display: none; }
  #poem-catalogue.is-paged .poem-item.is-visible { display: block; }

  @media (min-width: 768px) {
    .poems-title { font-size: 2.25rem; }
    #poems { padding: 2.5rem 2rem 2rem; }
  }

  @media (max-width: 640px) {
    #poems { padding: 1.5rem .5rem 1.25rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    #poems .poems-btn { transition: none; }
  }

  @media print {
    #poems { padding: 0; max-width: none; }
    #poem-catalogue.is-paged .poem-item { display: block !important; }
    #poem-pager { display: none !important; }
  }
</style>

<div id="poems">

  <header style="text-align:center;margin-bottom:2rem;padding-bottom:1.25rem;border-bottom:1px solid #D4D4D0">
    <h1 class="poems-title" style="margin:0 0 .5rem">诗集</h1>
    <p style="margin:0;font-size:.875rem;font-style:italic;color:#6B6B66">
      共 {{ poems.size }} 首{% if latest %} · 最近一篇 {{ latest.date | date: '%Y 年 %m 月 %d 日' }}{% endif %}
    </p>
  </header>

  <h2 style="margin:0 0 1.25rem;font-size:1.05rem">存稿目录</h2>

  <div id="poem-catalogue" data-per-page="5">
    <ol style="list-style:none;margin:0;padding:0">
      {% for poem in poems %}
      <li class="poem-item" style="padding-left:2rem;text-indent:-2rem;margin-bottom:1rem">
        <span style="color:#0B5394">[{{ forloop.index }}]</span>
        <a href="{{ poem.url | relative_url }}">{{ poem.title }}</a>
        <span class="poems-muted" style="font-size:.82rem">· {{ poem.date | date: '%Y 年 %m 月 %d 日' }}</span>
        <span class="poems-muted" style="font-size:.82rem">· {{ poem.content | strip_html | strip_newlines | replace: '  ', '' | normalize_whitespace | truncate: 40 }}</span>
      </li>
      {% endfor %}
    </ol>
  </div>

  <nav id="poem-pager" aria-label="存稿目录分页" style="display:none;margin-top:1.5rem;border-top:1px solid #D4D4D0;padding-top:1rem">
    <div id="poem-pager-bar" style="display:flex;flex-wrap:wrap;align-items:center;gap:.5rem"></div>
    <p id="poem-pager-status" class="poems-muted" aria-live="polite" style="margin:.7rem 0 0;font-size:.82rem;font-style:italic"></p>
  </nav>

</div>

<script>
(function () {
  const catalogue = document.getElementById('poem-catalogue');
  const pager = document.getElementById('poem-pager');
  const bar = document.getElementById('poem-pager-bar');
  const status = document.getElementById('poem-pager-status');
  if (!catalogue || !pager || !bar) return;

  const items = Array.from(catalogue.querySelectorAll('.poem-item'));
  const total = items.length;
  const perPage = parseInt(catalogue.getAttribute('data-per-page'), 10) || 5;
  const pages = Math.ceil(total / perPage);
  if (total === 0 || pages < 2) return;

  const reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  let current = 1;
  let prevBtn;
  let nextBtn;
  const numberBtns = [];

  /* Read the requested page from the URL, falling back to page 1. */
  function readPageFromUrl() {
    try {
      const n = parseInt(new URLSearchParams(window.location.search).get('p'), 10) || 1;
      return n >= 1 && n <= pages ? n : 1;
    } catch (e) {
      return 1;
    }
  }

  /* Reflect the current page in the URL without adding history entries. */
  function writePageToUrl(n) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (n > 1) params.set('p', String(n));
      else params.delete('p');
      const qs = params.toString();
      const url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
      window.history.replaceState(window.history.state, '', url);
    } catch (e) {}
  }

  /* Build a square paper-style button. */
  function createButton(text, ariaLabel) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'poems-btn';
    btn.textContent = text;
    if (ariaLabel) btn.setAttribute('aria-label', ariaLabel);
    return btn;
  }

  /* Show the requested page and sync controls, URL, and scroll position. */
  function go(n, scroll) {
    n = Math.min(Math.max(n, 1), pages);
    current = n;

    catalogue.classList.add('is-paged');
    items.forEach((item, i) => {
      item.classList.toggle('is-visible', Math.floor(i / perPage) === n - 1);
    });

    numberBtns.forEach((btn, i) => {
      const active = i + 1 === n;
      btn.classList.toggle('is-active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    prevBtn.disabled = n === 1;
    nextBtn.disabled = n === pages;

    if (status) {
      const start = (n - 1) * perPage + 1;
      const end = Math.min(n * perPage, total);
      status.textContent = `第 ${start}–${end} 首，共 ${total} 首（第 ${n} / ${pages} 页）`;
    }

    writePageToUrl(n);

    if (scroll) {
      const top = catalogue.getBoundingClientRect().top;
      if (top < 0) {
        try {
          window.scrollBy({ top: top - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
        } catch (e) {
          window.scrollBy(0, top - 16);
        }
      }
    }
  }

  prevBtn = createButton('‹ 上一页', '上一页');
  prevBtn.addEventListener('click', () => go(current - 1, true));

  nextBtn = createButton('下一页 ›', '下一页');
  nextBtn.addEventListener('click', () => go(current + 1, true));

  bar.appendChild(prevBtn);
  for (let p = 1; p <= pages; p++) {
    const btn = createButton(String(p), `第 ${p} 页`);
    btn.addEventListener('click', () => go(p, true));
    numberBtns.push(btn);
    bar.appendChild(btn);
  }
  bar.appendChild(nextBtn);

  window.addEventListener('popstate', () => go(readPageFromUrl(), false));

  pager.style.display = '';
  go(readPageFromUrl(), false);
})();
</script>