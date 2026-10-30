/*!
 * SiteEnhance · particle network background
 *
 * A canvas backdrop of drifting dots joined by hairlines. The module owns its
 * whole lifecycle so the effect can be switched off from the context menu; the
 * choice is persisted and re-applied on the next page load.
 *
 * Visuals live in `styles.ts` (the `particles` layer): the palette is read back
 * from the canvas' computed --pn-* custom properties, so a theme flip only
 * needs a re-read instead of a re-render.
 */
import { Enhance } from './core';
import type { ParticlesModule } from './types';

const CONFIG = Enhance.CONFIG.particles;
const storage = Enhance.storage;
const Toast = Enhance.Toast;
const bus = Enhance.bus;

const STORAGE_KEY = 'enhance:particles';

/* ---------------- Tunables ---------------- */
const CFG = {
  density: 20000,
  maxParticles: 44,
  minParticles: 18,
  speed: 0.12,
  linkDist: 120,
  mouseLinkDist: 145,
  mouseRadius: 110,
  mouseForce: 0.7,
  dotRadius: 1.6,
  accentEvery: 8
};

const BREATH_SPEED = 0.0006;
const BREATH_DEPTH = 0.18;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  accent: boolean;
}

const Particles: ParticlesModule | null = (function (): ParticlesModule | null {
  if (CONFIG.enabled === false) return null;

  /* Desktop-only decoration: narrow and touch viewports scroll a small area,
     and the stylesheet hides the canvas there anyway. */
  const allowed = !matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const supported = allowed && supportsCanvas();

  function supportsCanvas(): boolean {
    const probe = document.createElement('canvas');
    return typeof probe.getContext === 'function' && !!probe.getContext('2d');
  }

  /* Stored preference wins; otherwise the YAML/config default applies. */
  function readPreference(): boolean {
    const saved = storage.get(STORAGE_KEY, '');
    if (saved === 'on') return true;
    if (saved === 'off') return false;
    return CONFIG.enabled !== false;
  }

  let enabled = readPreference();

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------------- Palette (theme-aware) ---------------- */
  const palette = {
    dot: '',
    accent: '',
    line: '',
    mouse: '',
    lineAlpha: 0.16,
    dotAlpha: 0.45,
    mouseAlpha: 0.30
  };

  let canvas: HTMLCanvasElement | null = null;
  let ctx: CanvasRenderingContext2D | null = null;
  let particles: Particle[] = [];
  let W = 0;
  let H = 0;
  let dpr = 1;
  let mouseX: number | null = null;
  let mouseY: number | null = null;
  let rafId: number | null = null;
  let observer: MutationObserver | null = null;

  function readPalette(): void {
    if (!canvas) return;
    const cs = getComputedStyle(canvas);
    const val = function (name: string, fallback: string): string {
      return cs.getPropertyValue(name).trim() || fallback;
    };

    palette.dot = val('--pn-dot', '150,152,158');
    palette.accent = val('--pn-accent', palette.dot);
    palette.line = val('--pn-line', palette.dot);
    palette.mouse = val('--pn-mouse', palette.line);
    palette.lineAlpha = parseFloat(val('--pn-line-alpha', '0.16')) || 0.16;
    palette.dotAlpha = parseFloat(val('--pn-dot-alpha', '0.45')) || 0.45;
    palette.mouseAlpha = parseFloat(val('--pn-mouse-alpha', '0.30')) || 0.30;
  }

  function resize(): void {
    if (!canvas || !ctx) return;

    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;

    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(
      CFG.maxParticles,
      Math.max(CFG.minParticles, Math.round((W * H) / CFG.density))
    );

    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * CFG.speed * 2,
        vy: (Math.random() - 0.5) * CFG.speed * 2,
        r: CFG.dotRadius * (0.7 + Math.random() * 0.6),
        accent: i % CFG.accentEvery === 0
      });
    }
  }

  function update(): void {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
      else if (p.x > W) { p.x = W; p.vx = -Math.abs(p.vx); }
      if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
      else if (p.y > H) { p.y = H; p.vy = -Math.abs(p.vy); }

      if (mouseX !== null && mouseY !== null) {
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const d = Math.sqrt(dx * dx + dy * dy);

        if (d < CFG.mouseRadius && d > 0.001) {
          const f = (1 - d / CFG.mouseRadius) * CFG.mouseForce;
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }
    }
  }

  function draw(now = 0): void {
    const c = ctx;
    if (!c) return;

    c.clearRect(0, 0, W, H);

    const breath = 1 + BREATH_DEPTH * Math.sin(now * BREATH_SPEED);
    c.lineWidth = 1;

    const linkDist = CFG.linkDist;
    const link2 = linkDist * linkDist;

    /* 1) Particle-to-particle links */
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];

      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;

        if (d2 < link2) {
          const t = 1 - Math.sqrt(d2) / linkDist;
          const alpha = palette.lineAlpha * (0.25 + 0.75 * t) * breath;

          c.strokeStyle = `rgba(${palette.line},${alpha.toFixed(3)})`;
          c.lineWidth = 0.6 + 0.7 * t;
          c.beginPath();
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
        }
      }
    }

    /* 2) Mouse links */
    if (mouseX !== null && mouseY !== null) {
      const md = CFG.mouseLinkDist;
      const md2 = md * md;

      c.lineWidth = 1;

      for (let k = 0; k < particles.length; k++) {
        const p = particles[k];
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const d2 = dx * dx + dy * dy;

        if (d2 < md2) {
          const t = 1 - Math.sqrt(d2) / md;
          const alpha = palette.mouseAlpha * (0.2 + 0.8 * t);

          c.strokeStyle = `rgba(${palette.mouse},${alpha.toFixed(3)})`;
          c.beginPath();
          c.moveTo(p.x, p.y);
          c.lineTo(mouseX, mouseY);
          c.stroke();
        }
      }
    }

    /* 3) Dots */
    for (let n = 0; n < particles.length; n++) {
      const p = particles[n];

      let alpha = palette.dotAlpha * (p.accent ? 1.15 : 1);
      if (alpha > 1) alpha = 1;

      const r = p.r * (p.accent ? 1.15 : 1);
      c.fillStyle = `rgba(${p.accent ? palette.accent : palette.dot},${alpha.toFixed(3)})`;
      c.beginPath();
      c.arc(p.x, p.y, r, 0, Math.PI * 2);
      c.fill();
    }
  }

  /* ---------------- Main loop ---------------- */

  function loop(now: number): void {
    update();
    draw(now);
    rafId = requestAnimationFrame(loop);
  }

  function start(): void {
    if (rafId === null && !reduceMotion.matches) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function stop(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  /* ---------------- Events ---------------- */

  function onResize(): void {
    resize();
    if (rafId === null) draw(0);
  }

  function onPointerMove(event: PointerEvent): void {
    mouseX = event.clientX;
    mouseY = event.clientY;
  }

  function onPointerLeave(): void {
    mouseX = null;
    mouseY = null;
  }

  function onVisibilityChange(): void {
    if (document.hidden) stop();
    else if (enabled) start();
  }

  function onMotionChange(): void {
    if (reduceMotion.matches) {
      stop();
      draw(0);
    } else if (enabled) {
      start();
    }
  }

  /* ---------------- Lifecycle ---------------- */

  function mount(): void {
    if (!supported || canvas) return;

    const created = document.createElement('canvas');
    created.id = 'particles-bg';
    created.setAttribute('aria-hidden', 'true');
    document.body.appendChild(created);

    const context = created.getContext('2d');
    if (!context) {
      created.remove();
      return;
    }

    canvas = created;
    ctx = context;

    readPalette();
    resize();

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);
    reduceMotion.addEventListener('change', onMotionChange);

    /* Palette lives in CSS, so a theme flip only needs a fresh read. */
    observer = new MutationObserver(function () {
      readPalette();
      if (rafId === null && particles.length) draw(0);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-bs-theme']
    });

    if (reduceMotion.matches) draw(0);
    else start();
  }

  function unmount(): void {
    stop();

    if (observer) {
      observer.disconnect();
      observer = null;
    }

    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerleave', onPointerLeave);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    reduceMotion.removeEventListener('change', onMotionChange);

    if (canvas) canvas.remove();

    canvas = null;
    ctx = null;
    particles = [];
    mouseX = null;
    mouseY = null;
  }

  function setEnabled(next: boolean): boolean {
    if (!supported) {
      Toast.warn('当前设备不支持粒子背景');
      return false;
    }

    enabled = next;
    storage.set(STORAGE_KEY, next ? 'on' : 'off');

    if (next) mount();
    else unmount();

    bus.emit('particles:changed', { enabled: next });
    return next;
  }

  return {
    /* Safe to call repeatedly (e.g. after PJAX navigation). */
    init: function (): void {
      if (enabled) mount();
      else unmount();
    },
    toggle: function (): boolean {
      const next = setEnabled(!enabled);
      if (supported) Toast.show('粒子特效：' + (next ? '开' : '关'), 'info', 1200);
      return next;
    },
    setEnabled: setEnabled,
    isEnabled: function () { return enabled && supported; },
    isVisible: function () { return !!canvas; },
    label: function () {
      if (!supported) return '不支持';
      return enabled ? '开' : '关';
    }
  };
})();

Enhance.register('Particles', Particles);
