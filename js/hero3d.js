/*
 * Hero: projectile lab.
 * A wireframe ball is fired from a launcher. Power (launch speed), angle and the number of
 * latitude lines on the ball come from the control panel, and the dotted path, apex and
 * landing marker redraw as you type. Physics: no air resistance, g = 9.81 m/s^2.
 *   range R = v^2 sin(2a) / g,  max height H = v^2 sin^2(a) / 2g,  time T = 2 v sin(a) / g
 */
(function () {
  'use strict';

  var host = document.getElementById('hero-canvas');
  var heroEl = document.getElementById('hero');
  if (!host || !heroEl) return;

  function $(id) { return document.getElementById(id); }
  var el = {
    v: $('in-v'), vNum: $('in-v-num'),
    a: $('in-a'), aNum: $('in-a-num'),
    n: $('in-n'), nNum: $('in-n-num'),
    range: $('ro-range'), height: $('ro-height'), time: $('ro-time'),
    scale: $('lab-scale'), fire: $('lab-fire'), reset: $('lab-reset'), live: $('lab-live')
  };

  var G = 9.81;
  var DEFAULTS = { v: 30, a: 45, n: 10 };
  var LIMITS = { v: [5, 80], a: [5, 85], n: [3, 24] };
  var P = { v: DEFAULTS.v, a: DEFAULTS.a, n: DEFAULTS.n };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function clamp(x, lo, hi) { return Math.min(hi, Math.max(lo, x)); }
  function niceCeil(x) {
    var e = Math.pow(10, Math.floor(Math.log(x) / Math.LN10));
    var f = x / e;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * e;
  }
  function phys() {
    var r = P.a * Math.PI / 180;
    var vx = P.v * Math.cos(r), vy = P.v * Math.sin(r);
    var T = 2 * vy / G;
    return { vx: vx, vy: vy, T: T, R: vx * T, H: vy * vy / (2 * G), rad: r };
  }

  /* ---------- Control panel ---------- */
  function setFill(range) {
    var min = +range.min, max = +range.max;
    range.style.setProperty('--fill', ((range.value - min) / (max - min) * 100) + '%');
  }
  function syncControls() {
    el.v.value = el.vNum.value = P.v;
    el.a.value = el.aNum.value = P.a;
    el.n.value = el.nNum.value = P.n;
    setFill(el.v); setFill(el.a); setFill(el.n);
  }
  function bind(key, range, num) {
    range.addEventListener('input', function () {
      P[key] = +range.value;
      num.value = P[key];
      setFill(range);
      changed();
    });
    num.addEventListener('input', function () {
      var x = parseFloat(num.value);
      if (!isFinite(x)) return;
      P[key] = clamp(Math.round(x), LIMITS[key][0], LIMITS[key][1]);
      range.value = P[key];
      setFill(range);
      changed();
    });
    num.addEventListener('blur', function () { num.value = P[key]; });
  }
  bind('v', el.v, el.vNum);
  bind('a', el.a, el.aNum);
  bind('n', el.n, el.nNum);

  function fmt(x, d) { return x.toFixed(d); }
  function updateReadouts() {
    var p = phys();
    el.range.textContent = fmt(p.R, 1) + ' m';
    el.height.textContent = fmt(p.H, 1) + ' m';
    el.time.textContent = fmt(p.T, 2) + ' s';
  }

  /* ---------- Scene ---------- */
  var THREE = window.THREE;
  var renderer = null;
  try {
    if (!THREE) throw new Error('three.js did not load');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    host.setAttribute('data-fallback', 'true');
  }

  var scene, camera, rig, ball, ghosts = [], arcLine, arcDots, apexMark, apexDrop, landMark, barrel, speedArrow;
  var CYAN = 0x27e8ff, MINT = 0x3df5a8, AMBER = 0xffcf5c;
  var X0 = -6, LIFT = 0.3, BALL_R = 0.4, GHOSTS = 10, ARC_N = 140;
  var k = 0.1, kTarget = 0.1;          // scene units per metre
  var flying = false, landed = false, simT = 0, playRate = 1, arcDirty = true;

  function sphereGeometry(r, lat) {
    var lon = Math.max(6, (lat + 1) * 2), seg = 40, arcSeg = 20, v = [], i, j;
    for (i = 1; i <= lat; i++) {
      var phi = Math.PI * i / (lat + 1), y = r * Math.cos(phi), rr = r * Math.sin(phi);
      for (j = 0; j < seg; j++) {
        var a0 = 2 * Math.PI * j / seg, a1 = 2 * Math.PI * (j + 1) / seg;
        v.push(rr * Math.cos(a0), y, rr * Math.sin(a0), rr * Math.cos(a1), y, rr * Math.sin(a1));
      }
    }
    for (i = 0; i < lon; i++) {
      var th = 2 * Math.PI * i / lon;
      for (j = 0; j < arcSeg; j++) {
        var p0 = Math.PI * j / arcSeg, p1 = Math.PI * (j + 1) / arcSeg;
        v.push(r * Math.sin(p0) * Math.cos(th), r * Math.cos(p0), r * Math.sin(p0) * Math.sin(th),
               r * Math.sin(p1) * Math.cos(th), r * Math.cos(p1), r * Math.sin(p1) * Math.sin(th));
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return g;
  }

  function lineMat(color, opacity) { return new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }); }

  function dotTexture() {
    var cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    var g = cv.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.85)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }

  function gridLines(halfX, halfZ, color, opacity) {
    var v = [], i;
    for (i = -halfX; i <= halfX; i++) v.push(i, 0, -halfZ, i, 0, halfZ);
    for (i = -halfZ; i <= halfZ; i++) v.push(-halfX, 0, i, halfX, 0, i);
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return new THREE.LineSegments(g, lineMat(color, opacity));
  }

  function build() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    rig = new THREE.Group();
    scene.add(rig);

    // ground grid, back wall grid and the x axis
    rig.add(gridLines(8, 4, MINT, 0.2));
    var wall = [], i;
    for (i = -8; i <= 8; i++) wall.push(i, 0, -4, i, 7, -4);
    for (i = 0; i <= 7; i++) wall.push(-8, i, -4, 8, i, -4);
    var wg = new THREE.BufferGeometry();
    wg.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3));
    rig.add(new THREE.LineSegments(wg, lineMat(CYAN, 0.08)));
    var axis = new THREE.BufferGeometry();
    axis.setAttribute('position', new THREE.Float32BufferAttribute([-8, 0, 0, 8, 0, 0], 3));
    rig.add(new THREE.Line(axis, lineMat(MINT, 0.55)));

    // launcher: base and barrel
    var base = new THREE.CylinderGeometry(0.34, 0.52, 0.34, 10);
    var baseLines = new THREE.LineSegments(new THREE.EdgesGeometry(base), lineMat(CYAN, 0.9));
    baseLines.position.set(X0, 0.17, 0);
    rig.add(baseLines);
    var tube = new THREE.CylinderGeometry(0.13, 0.2, 1.5, 10, 1, true);
    tube.rotateZ(-Math.PI / 2);
    tube.translate(0.75, 0, 0);
    barrel = new THREE.Group();
    barrel.position.set(X0, LIFT, 0);
    barrel.add(new THREE.LineSegments(new THREE.EdgesGeometry(tube), lineMat(CYAN, 0.95)));
    rig.add(barrel);

    speedArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(X0, LIFT, 0), 1.2, AMBER, 0.32, 0.17);
    rig.add(speedArrow);

    // dotted path
    var dotTex = dotTexture();
    var arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_N + 1) * 3), 3));
    arcLine = new THREE.Line(arcGeo, lineMat(CYAN, 0.28));
    arcDots = new THREE.Points(arcGeo, new THREE.PointsMaterial({
      size: 0.11, color: CYAN, map: dotTex, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    arcLine.frustumCulled = arcDots.frustumCulled = false;
    rig.add(arcLine);
    rig.add(arcDots);

    // apex marker with a drop line, landing ring
    apexMark = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.17, 0)), lineMat(AMBER, 0.95));
    rig.add(apexMark);
    var dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    apexDrop = new THREE.Line(dropGeo, lineMat(AMBER, 0.35));
    apexDrop.frustumCulled = false;
    rig.add(apexDrop);
    var ring = [], s;
    for (s = 0; s < 40; s++) {
      var a0 = 2 * Math.PI * s / 40, a1 = 2 * Math.PI * (s + 1) / 40;
      ring.push(0.42 * Math.cos(a0), 0, 0.42 * Math.sin(a0), 0.42 * Math.cos(a1), 0, 0.42 * Math.sin(a1));
    }
    ring.push(-0.2, 0, 0, 0.2, 0, 0, 0, 0, -0.2, 0, 0, 0.2);
    var ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.Float32BufferAttribute(ring, 3));
    landMark = new THREE.LineSegments(ringGeo, lineMat(MINT, 0.95));
    rig.add(landMark);

    // the ball and its stroboscopic ghosts
    var geo = sphereGeometry(BALL_R, P.n);
    ball = new THREE.LineSegments(geo, lineMat(MINT, 0.98));
    rig.add(ball);
    for (var g = 0; g < GHOSTS; g++) {
      var gh = new THREE.LineSegments(geo, lineMat(MINT, 0.3));
      gh.visible = false;
      rig.add(gh);
      ghosts.push(gh);
    }

    host.appendChild(renderer.domElement);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
  }

  function rebuildBall() {
    var geo = sphereGeometry(BALL_R, P.n);
    ball.geometry.dispose();
    ball.geometry = geo;
    ghosts.forEach(function (g) { g.geometry = geo; });
  }

  /* position of the ball centre at time t, in scene units */
  function pointAt(t, out) {
    var p = phys();
    out.x = X0 + k * p.vx * t;
    out.y = LIFT + k * (p.vy * t - 0.5 * G * t * t);
    return out;
  }
  var tmp = { x: 0, y: 0 };

  function updateArc() {
    var p = phys(), pos = arcLine.geometry.attributes.position, i;
    for (i = 0; i <= ARC_N; i++) {
      pointAt(p.T * i / ARC_N, tmp);
      pos.setXYZ(i, tmp.x, Math.max(tmp.y, LIFT), 0);
    }
    pos.needsUpdate = true;
    pointAt(p.T / 2, tmp);
    apexMark.position.set(tmp.x, tmp.y, 0);
    var dp = apexDrop.geometry.attributes.position;
    dp.setXYZ(0, tmp.x, tmp.y, 0);
    dp.setXYZ(1, tmp.x, 0, 0);
    dp.needsUpdate = true;
    landMark.position.set(X0 + k * p.R, 0, 0);
    barrel.rotation.z = p.rad;
    var len = 0.6 + (P.v / LIMITS.v[1]) * 1.7;
    speedArrow.position.set(X0 + Math.cos(p.rad) * 1.5, LIFT + Math.sin(p.rad) * 1.5, 0);
    speedArrow.setDirection(new THREE.Vector3(Math.cos(p.rad), Math.sin(p.rad), 0));
    speedArrow.setLength(len, 0.32, 0.17);
    arcDirty = false;
  }

  /* ---------- Parameters changed ---------- */
  var lastN = P.n;
  function changed() {
    var p = phys();
    updateReadouts();
    var cell = niceCeil(Math.max(p.R / 11, p.H / 5));
    kTarget = 1 / cell;
    el.scale.textContent = 'One grid square is ' + (cell >= 1 ? cell : cell.toFixed(1)) + ' m.';
    flying = landed = false;
    if (renderer) {
      if (P.n !== lastN) { rebuildBall(); lastN = P.n; }
      ghosts.forEach(function (g) { g.visible = false; });
      arcDirty = true;
      kick();
    }
  }

  function fire() {
    var p = phys();
    el.live.textContent = 'Fired at ' + P.v + ' metres per second and ' + P.a + ' degrees. It will travel ' +
      fmt(p.R, 1) + ' metres, reach ' + fmt(p.H, 1) + ' metres high and stay in the air ' + fmt(p.T, 2) + ' seconds.';
    if (!renderer) return;
    ghosts.forEach(function (g) { g.visible = false; });
    simT = 0;
    playRate = p.T / clamp(p.T, 2.5, 6.5);
    if (reduceMotion) { simT = p.T; flying = false; landed = true; } else { flying = true; landed = false; }
    kick();
  }

  el.fire.addEventListener('click', fire);
  el.reset.addEventListener('click', function () {
    P.v = DEFAULTS.v; P.a = DEFAULTS.a; P.n = DEFAULTS.n;
    syncControls();
    changed();
    el.live.textContent = 'Reset to ' + P.v + ' metres per second, ' + P.a + ' degrees and ' + P.n + ' latitudes.';
  });

  syncControls();
  updateReadouts();
  (function initialScale() {
    var p = phys();
    kTarget = k = 1 / niceCeil(Math.max(p.R / 11, p.H / 5));
    el.scale.textContent = 'One grid square is ' + niceCeil(Math.max(p.R / 11, p.H / 5)) + ' m.';
  })();

  if (!renderer) {
    // No WebGL: the numbers above still update, the 3D view is simply unavailable.
    return;
  }

  build();

  /* ---------- Camera and sizing ---------- */
  var yaw = -0.5, px = 0, py = 0, pxS = 0, pyS = 0, active = false, drag = 0, dragging = false, lastX = 0;

  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    var aspect = w / h;
    camera.aspect = aspect;
    var tanHalf = Math.tan(camera.fov * Math.PI / 360);
    // pull back until the 16 unit wide grid (plus margin) fits the canvas width
    var d = Math.max(15, 19 / (2 * tanHalf * aspect * 0.98));
    camera.position.set(0, 4.2, d);
    camera.lookAt(0, 1.8, 0);
    camera.updateProjectionMatrix();
    rig.position.set(0, -0.4, 0);
    kick();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  heroEl.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') {
      if (dragging) { drag += (e.clientX - lastX) * 0.008; lastX = e.clientX; kick(); }
      return;
    }
    var r = host.getBoundingClientRect();
    px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    active = true;
    kick();
  });
  heroEl.addEventListener('pointerleave', function () { active = false; kick(); });
  host.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch') { dragging = true; lastX = e.clientX; } });
  window.addEventListener('pointerup', function () { dragging = false; });
  window.addEventListener('pointercancel', function () { dragging = false; });

  /* ---------- Loop (runs only while something is moving) ---------- */
  var running = false, raf = 0, last = 0, visible = true, spin = 0;

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.max(0, Math.min((now - last) / 1000, 0.1));
    last = now;
    var busy = false;

    // scale easing
    if (Math.abs(kTarget - k) > 1e-5) {
      k += (kTarget - k) * (1 - Math.exp(-dt * 7));
      if (Math.abs(kTarget - k) <= 1e-5) k = kTarget;
      arcDirty = true; busy = true;
    }
    if (arcDirty) updateArc();

    var p = phys();
    // ball
    if (flying) {
      simT += dt * playRate;
      if (simT >= p.T) { simT = p.T; flying = false; landed = true; }
      busy = true;
    }
    var tBall = (flying || landed) ? simT : 0;
    pointAt(tBall, tmp);
    ball.position.set(tmp.x, Math.max(tmp.y, LIFT), 0);
    if (flying) { spin += dt * 5; ball.rotation.z = -spin; ball.rotation.y = spin * 0.6; }

    // ghosts: one per equal slice of the flight, left behind as the ball passes
    for (var i = 0; i < GHOSTS; i++) {
      var tg = p.T * (i + 1) / (GHOSTS + 1);
      var show = (flying || landed) && simT >= tg;
      ghosts[i].visible = show;
      if (show) { pointAt(tg, tmp); ghosts[i].position.set(tmp.x, tmp.y, 0); }
    }

    // gentle pointer orbit
    var tx = active ? px : 0, ty = active ? py : 0;
    if (Math.abs(tx - pxS) > 1e-3 || Math.abs(ty - pyS) > 1e-3) { busy = true; }
    pxS += (tx - pxS) * 0.08;
    pyS += (ty - pyS) * 0.08;
    rig.rotation.y = yaw + pxS * 0.35 + drag;
    rig.rotation.x = pyS * 0.12;

    renderer.render(scene, camera);
    if (!busy) stop();
  }

  function start() {
    if (running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function kick() { start(); }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { resize(); start(); } else { stop(); }
    }, { threshold: 0 }).observe(host);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });

  updateArc();
  resize();
  start();

  // One orchestrated moment on load: fire the first shot once the page has settled.
  if (!reduceMotion) { setTimeout(function () { if (!flying && !landed) { simT = 0; playRate = phys().T / clamp(phys().T, 2.5, 6.5); flying = true; kick(); } }, 900); }
  else { simT = phys().T; landed = true; kick(); }
})();
