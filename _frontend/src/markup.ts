/*!
 * SiteEnhance · markup
 *
 * Owns the DOM half of the UI: every element the modules attach to - reading
 * progress bar, the two floating cards, context menu, toast host and the
 * shortcut dialog. Keeping it here instead of in `_includes/metadata-hook.html`
 * means a page needs exactly one <script> tag; markup, styles (`styles.ts`) and
 * the CDN hints below ship together and cannot drift apart, and an embedder gets
 * the same UI without copying any HTML out of the theme.
 *
 * Contract: the script must be deferred. Modules look these elements up at
 * import time, so the markup has to exist before they are evaluated.
 */

const MARKUP = `
<div id="reading-progress" aria-hidden="true"></div>

<div id="tool-cards" aria-live="polite" aria-atomic="false">

  <section id="player-card" class="tool-card h-card" hidden aria-label="背景音乐">
    <div class="enh-card-header" data-drag-handle>
      <i class="fa-fw fas fa-music enh-card-icon" aria-hidden="true"></i>
      <span class="enh-card-title" id="vplayer-title">背景音乐</span>
      <button type="button" class="enh-card-close" data-close
              aria-label="关闭音乐播放器" title="关闭">×</button>
    </div>
    <div class="enh-card-body">
      <span class="player-ctrl">
        <button type="button" data-pctl="prev" aria-label="上一首" title="上一首">
          <i class="fas fa-backward-step" aria-hidden="true"></i>
        </button>
        <button type="button" data-pctl="toggle" aria-label="播放或暂停" title="播放 / 暂停">
          <i class="fas fa-play" aria-hidden="true"></i>
        </button>
        <button type="button" data-pctl="next" aria-label="下一首" title="下一首">
          <i class="fas fa-forward-step" aria-hidden="true"></i>
        </button>
      </span>
      <span class="enh-card-hint" id="vplayer-hint">点击播放</span>
      <span class="player-progress" aria-hidden="true"><i id="vplayer-progress"></i></span>
    </div>
  </section>

  <section id="quotify-card" class="tool-card h-card quotify-card" hidden
           aria-label="引语" role="button" tabindex="0"
           title="点击卡片换一句">
    <div class="enh-card-header" data-drag-handle>
      <i class="fa-fw fas fa-quote-left enh-card-icon" aria-hidden="true"></i>
      <span class="enh-card-title">引语</span>
      <button type="button" class="enh-card-close" data-close
              aria-label="关闭引语" title="关闭">×</button>
    </div>
    <div class="enh-card-body">
      <span class="enh-card-hint">点击换一句</span>
      <span class="quotify-content quotify-loading">正在加载引语…</span>
      <span class="quotify-meta"></span>
    </div>
  </section>

</div>

<div id="custom-context-menu" class="ctx-menu" role="menu"
     aria-label="上下文菜单" hidden></div>

<div id="toast-host" aria-live="polite" aria-atomic="false"></div>

<div id="shortcuts-modal" class="sc-modal" role="dialog"
     aria-modal="true" aria-label="键盘快捷键" hidden>
  <div class="sc-modal-backdrop" data-close></div>
  <div class="sc-modal-body" role="document">
    <header class="sc-modal-header">
      <h3>键盘快捷键</h3>
      <button type="button" class="sc-modal-close" data-close aria-label="关闭">×</button>
    </header>
    <ul class="sc-list">
      <li><kbd>Alt</kbd> + <kbd>Z</kbd><span>简繁转换</span></li>
      <li><kbd>Alt</kbd> + <kbd>空格</kbd><span>播放 / 暂停音乐</span></li>
      <li><kbd>Shift</kbd> + <kbd>右键</kbd><span>恢复浏览器菜单</span></li>
      <li><kbd>Esc</kbd><span>关闭当前弹层</span></li>
      <li><kbd>?</kbd><span>显示本帮助</span></li>
    </ul>
  </div>
</div>
`;

/* Warm up the origins the modules fetch from (Howler, OpenCC, the quote API). */
const HINTS: Array<{ rel: string; href: string; cross: boolean }> = [
  { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', cross: true },
  { rel: 'preconnect', href: 'https://quot.exyon.ee', cross: true },
  { rel: 'dns-prefetch', href: 'https://unpkg.com', cross: false }
];

/* Marker used for the idempotency check: present only after this markup ran (or
   when a page already ships the old inline copy, which still works). */
const ANCHOR_ID = 'tool-cards';

/**
 * Appends the enhancement DOM to <body>. Safe to call more than once, and it
 * steps aside when the markup is already there.
 */
export function installMarkup(): void {
  if (document.getElementById(ANCHOR_ID)) return;

  const body = document.body;
  if (!body) {
    console.warn('[chirpy-enhance] markup: the script must be deferred, no <body> yet');
    return;
  }

  const template = document.createElement('template');
  template.innerHTML = MARKUP;
  body.appendChild(template.content);
}

function installHints(): void {
  HINTS.forEach(function (hint) {
    if (document.head.querySelector('link[' + hint.rel + '][href="' + hint.href + '"]')) return;

    const link = document.createElement('link');
    link.rel = hint.rel;
    link.href = hint.href;
    if (hint.cross) link.crossOrigin = '';
    document.head.appendChild(link);
  });
}

installMarkup();
installHints();
