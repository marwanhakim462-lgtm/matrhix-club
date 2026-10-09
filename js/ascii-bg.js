/*
 * Hero background: a slow field of ASCII characters.
 * Several sine waves are summed per cell, and the total picks a character from a ramp
 * (sparse dots up to dense marks). The pointer adds a ripple. The field fades toward the
 * left, so the headline copy stays easy to read.
 * It only runs while the hero is on screen and the tab is visible, at about 24 frames a second.
 * With reduced motion it draws a single still frame. It is hidden below 1024px (CSS shows stars there).
 */
(function () {
  'use strict';

  var cv = document.getElementById('ascii-bg');
  var hero = document.getElementById('hero');
  if (!cv || !hero || !cv.getContext) return;

  var ctx = cv.getContext('2d');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var RAMP = ' .·:-=+*#%@';
  var FONT = 14, CH = 20, CW = 8.4;
  var cols = 0, rows = 0, w = 0, h = 0;
  var running = false, raf = 0, last = 0, t = reduceMotion ? 4 : 0, visible = true;
  var pc = -99, pr = -99, pActive = 0;

  function size() {
    w = cv.clientWidth; h = cv.clientHeight;
    if (!w || !h) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'top';
    CW = ctx.measureText('M').width || CW;
    cols = Math.ceil(w / CW); rows = Math.ceil(h / CH);
    return true;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff';
    var top = RAMP.length - 1, c, r;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) {
        var v = Math.sin(c * 0.09 + t * 0.9) + Math.sin(r * 0.16 - t * 0.7) + Math.sin((c + r) * 0.06 + t * 0.5) +
          Math.sin(Math.sqrt(Math.pow(c - cols * 0.72, 2) + Math.pow((r - rows * 0.5) * 2, 2)) * 0.12 - t * 1.2);
        v = (v + 4) / 8;
        if (pActive > 0.02) {
          var d2 = Math.pow(c - pc, 2) + Math.pow((r - pr) * 2, 2);
          v += pActive * 0.55 * Math.exp(-d2 / 160) * (0.65 + 0.35 * Math.sin(Math.sqrt(d2) * 0.5 - t * 6));
        }
        var x = c / cols;
        var mask = 0.38 + 0.62 * Math.min(1, Math.max(0, (x - 0.1) / 0.5));
        v = Math.max(0, (v - 0.34) * 2.1) * mask;
        if (v < 0.05) continue;
        if (v > 1) v = 1;
        ctx.globalAlpha = 0.09 + 0.36 * v;
        ctx.fillText(RAMP.charAt(Math.max(1, Math.round(v * top))), c * CW, r * CH);
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (now - last < 42) return;
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    t += dt;
    pActive = Math.max(0, pActive - dt * 0.9);
    draw();
  }

  function start() {
    if (running || !visible || document.hidden || reduceMotion || !w) return;
    running = true; last = performance.now(); raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function setup() {
    if (!size()) { stop(); return; }
    draw();
    start();
  }

  if ('ResizeObserver' in window) new ResizeObserver(setup).observe(cv);
  else window.addEventListener('resize', setup);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  hero.addEventListener('pointermove', function (e) {
    if (reduceMotion || e.pointerType === 'touch' || !w) return;
    var r = cv.getBoundingClientRect();
    pc = (e.clientX - r.left) / CW; pr = (e.clientY - r.top) / CH;
    pActive = 1;
  });

  setup();
})();
