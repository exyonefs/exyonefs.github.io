/*!
 * SiteEnhance · stylesheet
 *
 * The enhancement UI carries its own CSS instead of borrowing the theme
 * stylesheet: the bundle is also loaded from mirrors and third-party pages, and
 * a runtime-injected <style> travels inside the script. Nothing has to be
 * fetched from another origin, so there is no second cross-origin request, no
 * CORS / ACAO dependency and no "stylesheet 404 but markup still renders" mode.
 *
 * Layers, in cascade order:
 *   tokens   - custom properties every other layer reads
 *   cards    - floating card chrome shared by player and quote
 *   player   - music card internals
 *   quotes   - quote card internals
 *   menu     - context menu and submenu panels
 *   toast    - transient messages
 *   modal    - shortcut dialog
 *   progress - reading progress bar
 *   clickFx  - click decorations
 *   particles- canvas backdrop palette (read back by particles.ts)
 *   theme    - dark-mode overrides
 *   a11y     - contrast / reduced motion / focus
 *   print    - hide everything floating when printing
 *
 * These rules are plain CSS - no Sass, no @include. They are flattened copies
 * of what used to live in assets/css/jekyll-theme-chirpy.scss; that file now
 * keeps only theme-level customisation (typography, sidebar, code blocks).
 */

/* ---------------------------------------------------------------- tokens -- */

const TOKENS = `
:root {
  --enh-bg: var(--card-bg, var(--bs-body-bg, #ffffff));
  --enh-text: var(--text-color, var(--bs-body-color, #212529));
  --enh-muted: var(--text-muted-color, var(--bs-secondary-color, #6c757d));
  --enh-border: var(--btn-border-color, var(--bs-border-color, #dee2e6));
  --enh-primary: var(--bs-primary, #0d6efd);
  --enh-hover: var(--bs-primary-bg-subtle, rgba(13, 110, 253, .1));
  --enh-danger: #d14343;

  --enh-radius: .65rem;
  --enh-radius-sm: .4rem;
  --enh-shadow: 0 6px 24px rgba(0, 0, 0, .12);
  --enh-shadow-lg: 0 12px 40px rgba(0, 0, 0, .16);

  /* Single source of truth for stacking order. */
  --z-progress: 1030;
  --z-click-fx: 1040;
  --z-cards: 1055;
  --z-ctx: 1055;
  --z-modal: 1060;
  --z-toast: 1070;
}
`;

/* ----------------------------------------------------------------- cards -- */

const CARDS = `
#tool-cards {
  position: fixed;
  inset: 0;
  z-index: var(--z-cards);
  pointer-events: none;
}

#tool-cards > * { pointer-events: auto; }

.tool-card {
  position: fixed;
  top: 1rem;
  right: 1rem;
  width: 18rem;
  max-width: calc(100vw - 1rem);
  background: var(--enh-bg);
  border: 1px solid var(--enh-border);
  border-radius: var(--enh-radius);
  box-shadow: var(--enh-shadow-lg);
  overflow: hidden;

  /* visibility (not display) keeps the compositing layer, avoiding a flash. */
  visibility: hidden;
  opacity: 0;
  transform: translateY(-6px) scale(.98);
  transform-origin: top right;
  transition: opacity .24s cubic-bezier(.2, .7, .3, 1),
              transform .24s cubic-bezier(.2, .7, .3, 1),
              box-shadow .2s ease,
              visibility 0s linear .24s;
  will-change: opacity, transform;
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .tool-card {
    background: color-mix(in srgb, var(--enh-bg) 88%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(1.6);
    backdrop-filter: blur(16px) saturate(1.6);
  }
}

/* Preserve the semantic hidden attribute without removing the element. */
.tool-card[hidden] { display: block; }

.tool-card.open {
  visibility: visible;
  opacity: 1;
  transform: translateY(0) scale(1);
  transition: opacity .24s cubic-bezier(.2, .7, .3, 1),
              transform .24s cubic-bezier(.2, .7, .3, 1),
              box-shadow .2s ease,
              visibility 0s;
}

.tool-card.dragging {
  transition: opacity .24s cubic-bezier(.2, .7, .3, 1),
              transform .24s cubic-bezier(.2, .7, .3, 1);
  box-shadow: 0 18px 56px rgba(0, 0, 0, .25);
  cursor: grabbing;
  user-select: none;
}

.tool-card.is-error .enh-card-hint {
  color: var(--enh-danger);
  opacity: 1;
}

.tool-card.is-loading .enh-card-icon { opacity: .6; }

@media (max-width: 480px) {
  .tool-card { width: calc(100vw - 1rem); }
}

/* Card header also acts as drag handle. */
.enh-card-header {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .5rem .65rem;
  cursor: grab;
  border-bottom: 1px solid var(--enh-border);
  -webkit-user-select: none;
  user-select: none;
}

.enh-card-header:active { cursor: grabbing; }

.enh-card-icon {
  font-size: .95rem;
  color: var(--enh-primary);
  flex-shrink: 0;
}

.enh-card-title {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: .8rem;
  font-weight: 600;
  letter-spacing: .04em;
  color: var(--enh-text);
}

.enh-card-close {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  line-height: 1;
  color: var(--enh-muted);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color .15s ease, color .15s ease, transform .2s ease;
}

.enh-card-close:hover {
  color: var(--enh-primary);
  background: var(--enh-hover);
  transform: rotate(90deg);
}

.enh-card-body {
  padding: .6rem .75rem .7rem;
  color: var(--enh-text);
  font-size: .82rem;
  line-height: 1.6;
}

.enh-card-hint {
  display: block;
  font-size: .62rem;
  color: var(--enh-muted);
  opacity: .7;
  margin-bottom: .25rem;
}
`;

/* ---------------------------------------------------------------- player -- */

const PLAYER = `
.player-ctrl {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .4rem;
  margin-bottom: .4rem;
}

.player-ctrl button {
  width: 1.8rem;
  height: 1.8rem;
  padding: 0;
  border-radius: 50%;
  border: 1px solid var(--enh-border);
  background: transparent;
  color: var(--enh-text);
  font-size: .72rem;
  line-height: 1;
  cursor: pointer;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}

.player-ctrl button:hover:not(:disabled) {
  color: var(--enh-primary);
  background: var(--enh-hover);
  border-color: color-mix(in srgb, var(--enh-primary) 35%, var(--enh-border));
}

/* Visible but inert while the engine is loading or offline. */
.player-ctrl button:disabled {
  opacity: .45;
  cursor: default;
}

@media (max-width: 768px) {
  .player-ctrl button {
    width: 2.4rem;
    height: 2.4rem;
    font-size: .82rem;
  }
}

/* Buffering spinner appended to the hint line. */
.player-hint::after {
  content: '';
  display: none;
  width: 10px;
  height: 10px;
  margin-left: 6px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  vertical-align: -1px;
  animation: player-spin 0.8s linear infinite;
}

#player-card.is-buffering .player-hint::after { display: inline-block; }

@keyframes player-spin {
  to { transform: rotate(360deg); }
}

#player-card.is-playing .enh-card-icon {
  color: var(--enh-primary);
  animation: enhMusicPulse 1.6s ease-in-out infinite;
}

@keyframes enhMusicPulse {
  0%, 100% { opacity: 1;  transform: scale(1); }
  50%      { opacity: .55; transform: scale(.9); }
}

/* Playback progress - fill driven by width, track is seekable. */
.player-progress {
  position: relative;
  display: block;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  overflow: hidden;
  cursor: pointer;
  background: color-mix(in srgb, var(--enh-primary) 14%, transparent);
}

/* Invisible band widening the touch target. */
.player-progress::after {
  content: '';
  position: absolute;
  inset: -9px 0;
}

.player-progress i {
  display: block;
  width: 0;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--enh-primary), #a855f7);
  transition: width .3s linear;
}
`;

/* ---------------------------------------------------------------- quotes -- */

const QUOTES = `
.quotify-card .enh-card-body { cursor: pointer; }

.quotify-content {
  display: block;
  font-size: .88rem;
  line-height: 1.7;
  color: var(--enh-text);
  transition: opacity .25s ease;
  word-break: break-word;
}

.quotify-content.quotify-loading { opacity: .55; }
.quotify-content.quotify-error   { color: var(--enh-danger); }

.quotify-meta {
  display: block;
  margin-top: .3rem;
  font-size: .68rem;
  color: var(--enh-muted);
}
`;

/* ------------------------------------------------------------------ menu -- */

/* Panel recipe shared by both menus, expanded twice because plain CSS has no
   mixins: position fixed, frosted surface, scale-in transition. */
const MENU = `
.ctx-menu {
  position: fixed;
  min-width: 13rem;
  max-width: 22rem;
  max-height: calc(100vh - 1rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: .35rem;
  z-index: var(--z-ctx);
  background: var(--enh-bg);
  border: 1px solid var(--enh-border);
  border-radius: var(--enh-radius);
  box-shadow: var(--enh-shadow-lg);
  opacity: 0;
  transform: scale(.95);
  transform-origin: top left;
  transition: opacity .14s ease, transform .14s cubic-bezier(.2, .7, .3, 1);
  user-select: none;
  pointer-events: none;
}

/* Submenus live on <body> so a scrolling parent can never clip them. */
.ctx-submenu {
  position: fixed;
  min-width: 11rem;
  max-width: 20rem;
  max-height: calc(100vh - 1rem);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: .35rem;
  z-index: var(--z-ctx);
  background: var(--enh-bg);
  border: 1px solid var(--enh-border);
  border-radius: var(--enh-radius);
  box-shadow: var(--enh-shadow-lg);
  opacity: 0;
  transform: scale(.97);
  transform-origin: top left;
  transition: opacity .12s ease, transform .12s cubic-bezier(.2, .7, .3, 1);
  user-select: none;
}

@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .ctx-menu {
    background: color-mix(in srgb, var(--enh-bg) 90%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(1.6);
    backdrop-filter: blur(16px) saturate(1.6);
  }

  .ctx-submenu {
    background: color-mix(in srgb, var(--enh-bg) 94%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(1.6);
    backdrop-filter: blur(16px) saturate(1.6);
  }
}

.ctx-menu.visible {
  opacity: 1;
  transform: scale(1);
  pointer-events: auto;
}

.ctx-submenu.visible {
  opacity: 1;
  transform: scale(1);
}

.ctx-menu::-webkit-scrollbar,
.ctx-submenu::-webkit-scrollbar { width: 6px; }

.ctx-menu::-webkit-scrollbar-thumb,
.ctx-submenu::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: color-mix(in srgb, var(--enh-muted) 45%, transparent);
}

.ctx-item {
  display: flex;
  align-items: center;
  gap: .6rem;
  padding: .48rem .7rem;
  border-radius: var(--enh-radius-sm);
  cursor: pointer;
  color: var(--enh-text);
  font-size: .8rem;
  transition: background-color .14s ease, color .14s ease;
  white-space: nowrap;
  outline: none;
}

.ctx-item:hover,
.ctx-item:focus-visible,
.ctx-item.is-expanded {
  background: var(--enh-hover);
  color: var(--enh-primary);
}

/* Command opening a submenu - keeps a trailing chevron on the right. */
.ctx-item.has-submenu { justify-content: flex-start; }

.ctx-item.is-expanded .ctx-arrow { opacity: 1; }

.ctx-arrow {
  flex: 0 0 auto;
  margin-left: auto;
  font-size: .7rem;
  opacity: .6;
}

.ctx-icon {
  width: 1rem;
  text-align: center;
  font-size: .82rem;
  flex-shrink: 0;
  opacity: .85;
}

.ctx-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ctx-state {
  font-style: normal;
  font-size: .7rem;
  color: var(--enh-muted);
  opacity: .8;
  font-variant-numeric: tabular-nums;
}

.ctx-divider {
  height: 1px;
  margin: .3rem .5rem;
  background: var(--enh-border);
  opacity: .7;
}

.ctx-hint {
  padding: .35rem .7rem .25rem;
  font-size: .66rem;
  text-align: center;
  color: var(--enh-muted);
  opacity: .65;
  white-space: nowrap;
  border-top: 1px solid var(--enh-border);
  margin-top: .3rem;
}

.ctx-hint kbd {
  font-family: inherit;
  font-size: .95em;
  padding: 0 .3em;
  border-radius: .25em;
  background: var(--bs-tertiary-bg, rgba(0, 0, 0, .06));
  border: 1px solid var(--enh-border);
}
`;

/* ----------------------------------------------------------------- toast -- */

const TOAST = `
#toast-host {
  position: fixed;
  left: 50%;
  bottom: 5.5rem;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .5rem;
  z-index: var(--z-toast);
  pointer-events: none;
}

@media (max-width: 768px) {
  #toast-host { bottom: 4rem; }
}

.toast-item {
  padding: .55rem 1rem;
  border-radius: 999px;
  background: var(--enh-bg);
  color: var(--enh-text);
  border: 1px solid var(--enh-border);
  box-shadow: var(--enh-shadow);
  font-size: .82rem;
  opacity: 0;
  transform: translateY(8px) scale(.96);
  transition: opacity .28s ease, transform .28s cubic-bezier(.2, .7, .3, 1);
  will-change: opacity, transform;
  max-width: 80vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toast-item.show { opacity: 1; transform: translateY(0) scale(1); }

.toast-item.toast-success { border-color: color-mix(in srgb, #28c840 50%, var(--enh-border)); }
.toast-item.toast-warn    { border-color: color-mix(in srgb, #febc2e 50%, var(--enh-border)); }
.toast-item.toast-error   { border-color: color-mix(in srgb, #ff5f57 50%, var(--enh-border)); }
`;

/* ----------------------------------------------------------------- modal -- */

const MODAL = `
.sc-modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity .2s ease;
}

/* Author-level display would defeat the hidden attribute - keep both explicit. */
.sc-modal[hidden] { display: none; }
.sc-modal.open    { opacity: 1; }

.sc-modal.open .sc-modal-body { transform: scale(1); }

.sc-modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
}

.sc-modal-body {
  position: relative;
  width: min(92vw, 26rem);
  max-height: 80vh;
  overflow: auto;
  background: var(--enh-bg);
  color: var(--enh-text);
  border: 1px solid var(--enh-border);
  border-radius: var(--enh-radius);
  box-shadow: var(--enh-shadow-lg);
  transform: scale(.96);
  transition: transform .24s cubic-bezier(.2, .7, .3, 1);
  padding: .5rem 0 1rem;
}

.sc-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: .75rem 1rem;
  border-bottom: 1px solid var(--enh-border);
}

.sc-modal-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.sc-modal-close {
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  color: var(--enh-muted);
  font-size: 1.35rem;
  line-height: 1;
  border-radius: var(--enh-radius-sm);
  cursor: pointer;
  transition: background-color .14s ease, color .14s ease;
}

.sc-modal-close:hover {
  background: var(--enh-hover);
  color: var(--enh-primary);
}

.sc-list {
  list-style: none;
  padding: .5rem .5rem 0;
  margin: 0;
}

.sc-list li {
  display: flex;
  align-items: center;
  gap: .5rem;
  padding: .55rem .85rem;
  font-size: .84rem;
}

.sc-list li span {
  margin-left: auto;
  color: var(--enh-muted);
  font-size: .8rem;
}

.sc-list kbd {
  display: inline-block;
  padding: .15em .5em;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: .78rem;
  background: var(--bs-tertiary-bg, rgba(0, 0, 0, .06));
  border: 1px solid var(--enh-border);
  border-bottom-width: 2px;
  border-radius: .35em;
  color: var(--enh-text);
  min-width: 1.6em;
  text-align: center;
}
`;

/* -------------------------------------------------------------- progress -- */

const PROGRESS = `
#reading-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 2px;
  width: 100%;
  z-index: var(--z-progress);
  pointer-events: none;

  transform: scaleX(0);
  transform-origin: 0 50%;
  border-radius: 0 999px 999px 0;

  background: linear-gradient(90deg, #6dd5a0 0%, #30b166 50%, #1e8e5a 100%);

  box-shadow:
    0 0 6px rgba(48, 177, 102, 0.4),
    0 0 1px rgba(30, 142, 90, 0.3);

  will-change: transform;
}

[data-bs-theme='dark'] #reading-progress {
  background: linear-gradient(90deg, #ffc06a 0%, #ff8c1a 50%, #f56d00 100%);

  box-shadow:
    0 0 12px rgba(255, 140, 26, 0.6),
    0 0 4px rgba(245, 109, 0, 0.45),
    inset 0 0 2px rgba(255, 255, 255, 0.15);
}

/* High-density displays. */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  #reading-progress { height: 2.5px; }
}
`;

/* ------------------------------------------------------------ click fx ---- */

const CLICK_FX = `
.click-effect {
  position: absolute;
  pointer-events: none;
  user-select: none;
  will-change: transform, opacity;
  z-index: var(--z-click-fx);
}

/* "word" - label floats up and fades out. */
.click-word {
  font-weight: 700;
  font-size: .8rem;
  letter-spacing: .05em;
  white-space: nowrap;
  color: var(--ce-color, #8b5cf6);
  text-shadow: 0 1px 6px rgba(0, 0, 0, .16);
  transform: translate(-50%, -50%);
  animation: enhWordFloat 1.05s cubic-bezier(.22, .61, .36, 1) forwards;
}

@keyframes enhWordFloat {
  0%   { opacity: 0; transform: translate(-50%, -50%) translateY(9px)   scale(.7); }
  22%  { opacity: 1; transform: translate(-50%, -50%) translateY(0)     scale(1.06); }
  60%  { opacity: 1; transform: translate(-50%, -50%) translateY(-13px) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) translateY(-34px) scale(.92); }
}

/* "ripple" - soft core plus two staggered expanding rings. */
.click-ripple {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--ce-color, #8b5cf6) 85%, transparent) 0%,
    transparent 70%
  );
}

.click-ripple::before,
.click-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--ce-color, #8b5cf6) 62%, transparent);
  animation: enhRipple .9s cubic-bezier(.2, .7, .3, 1) forwards;
}

.click-ripple::after {
  border-color: color-mix(in srgb, var(--ce-color, #8b5cf6) 32%, transparent);
  animation-delay: .13s;
}

@keyframes enhRipple {
  0%   { opacity: .95; transform: scale(1); }
  100% { opacity: 0;   transform: scale(6.5); }
}

/* "confetti" - pieces burst outward while spinning. */
.click-confetti {
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
}

.click-confetti i {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 6px;
  background: var(--c, #f66);
  border-radius: 1px;
  animation: enhConfetti var(--t, .85s) cubic-bezier(.16, .72, .34, 1) var(--dl, 0s) forwards;
}

@keyframes enhConfetti {
  0% {
    opacity: 1;
    transform: rotate(var(--a, 0deg)) translateY(0) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: rotate(var(--a, 0deg)) translateY(calc(-1 * var(--d, 40px)))
               rotate(var(--r, 180deg)) scale(.35);
  }
}
`;

/* ------------------------------------------------------------- particles -- */

/* Palette variables are scoped to #particles-bg so they never leak into the
   global namespace; particles.ts reads them back through getComputedStyle. */
const PARTICLES = `
#particles-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  display: block;
  pointer-events: none;

  /* Light: neutral cool grays with a subdued blue accent. */
  --pn-dot:         96, 102, 112;
  --pn-accent:      62, 109, 174;
  --pn-line:       104, 110, 120;
  --pn-mouse:       58,  96, 150;
  --pn-line-alpha:  .30;
  --pn-dot-alpha:   .66;
  --pn-mouse-alpha: .46;
}

@media (max-width: 768px), (pointer: coarse) {
  #particles-bg { display: none !important; }
}

/* Dark: cool slate-blue - inverse of the light neutral grays. */
[data-bs-theme='dark'] #particles-bg {
  --pn-dot:         178, 194, 216;
  --pn-accent:      122, 188, 240;
  --pn-line:        178, 194, 216;
  --pn-mouse:       170, 210, 246;
  --pn-line-alpha:  .34;
  --pn-dot-alpha:   .82;
  --pn-mouse-alpha: .52;
}
`;

/* ----------------------------------------------------------------- theme -- */

const THEME = `
[data-bs-theme='dark'] {
  --enh-shadow:    0 6px 28px rgba(0, 0, 0, .5);
  --enh-shadow-lg: 0 14px 48px rgba(0, 0, 0, .62);
  --enh-danger:    #ff8a80;
}

[data-bs-theme='dark'] .ctx-menu,
[data-bs-theme='dark'] .ctx-submenu,
[data-bs-theme='dark'] .sc-modal-body,
[data-bs-theme='dark'] .tool-card {
  border-color: rgba(255, 255, 255, .08);
}

[data-bs-theme='dark'] .toast-item { border-color: rgba(255, 255, 255, .1); }
`;

/* ------------------------------------------------------------------ a11y -- */

const A11Y = `
:focus-visible {
  outline: 2px solid var(--enh-primary);
  outline-offset: 2px;
}

@media (prefers-contrast: more) {
  :root {
    --enh-border: currentColor;
    --enh-shadow: none;
    --enh-shadow-lg: none;
  }

  .ctx-item:hover { outline: 1px solid currentColor; }
}

@media (prefers-reduced-motion: reduce) {
  .tool-card,
  .ctx-menu,
  .ctx-submenu,
  .toast-item,
  .sc-modal,
  .sc-modal-body,
  .click-effect,
  .click-word,
  .click-ripple,
  .click-confetti i,
  .enh-card-close,
  .player-progress i,
  #player-card.is-playing .enh-card-icon,
  #reading-progress {
    animation: none !important;
    transition: none !important;
  }
}
`;

/* ----------------------------------------------------------------- print -- */

const PRINT = `
@media print {
  #tool-cards,
  .ctx-menu,
  .ctx-submenu,
  #toast-host,
  .sc-modal,
  #reading-progress,
  #particles-bg { display: none !important; }
}
`;

/* ------------------------------------------------------------- injection -- */

const STYLE_ID = 'site-enhance-styles';

/* Ordered once so the cascade is explicit and easy to extend: a new concern
   becomes a new layer instead of a rule appended at the bottom. */
const LAYERS: Array<{ name: string; css: string }> = [
  { name: 'tokens', css: TOKENS },
  { name: 'cards', css: CARDS },
  { name: 'player', css: PLAYER },
  { name: 'quotes', css: QUOTES },
  { name: 'menu', css: MENU },
  { name: 'toast', css: TOAST },
  { name: 'modal', css: MODAL },
  { name: 'progress', css: PROGRESS },
  { name: 'click-fx', css: CLICK_FX },
  { name: 'particles', css: PARTICLES },
  { name: 'theme', css: THEME },
  { name: 'a11y', css: A11Y },
  { name: 'print', css: PRINT }
];

/* Idempotent: the bundle may be evaluated twice (PJAX swaps, or a page that
   already inlined a copy), and a duplicated sheet would double every rule. */
export function installStyles(): void {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.setAttribute('data-enhance', 'stylesheet');
  style.textContent = LAYERS.map(function (layer) {
    return '/* ' + layer.name + ' */\n' + layer.css.trim();
  }).join('\n\n');

  (document.head || document.documentElement).appendChild(style);
}

installStyles();
