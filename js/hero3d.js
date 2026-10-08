/*
 * Hero: an editable 3x3 matrix M drives a live 3D scene.
 * The lattice, unit cube and floor grid are children of one group whose matrix is M,
 * so the GPU does the transform. The basis vectors i, j, k are drawn as the columns of M.
 */
(function () {
  'use strict';

  var host = document.getElementById('hero-canvas');
  var inputs = Array.prototype.slice.call(document.querySelectorAll('.cell'));
  var detEl = document.getElementById('hud-det');
  var noteEl = document.getElementById('hud-note');
  var liveEl = document.getElementById('hud-live');
  var presetBtns = Array.prototype.slice.call(document.querySelectorAll('.preset'));
  if (!host || inputs.length !== 9) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var c40 = Math.cos(Math.PI * 0.22), s40 = Math.sin(Math.PI * 0.22);

  var PRESETS = {
    identity: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    stretch: [1.5, 0, 0, 0, 0.6, 0, 0, 0, 1.2],
    shear: [1, 0.8, 0, 0, 1, 0.4, 0, 0, 1],
    rotate: [c40, -s40, 0, s40, c40, 0, 0, 0, 1],
    reflect: [-1, 0, 0, 0, 1, 0, 0, 0, 1],
    flatten: [1, 0, 0, 0, 1, 0, 0, 0, 0.05]
  };
  var PRESET_NAMES = {
    identity: 'Identity', stretch: 'Stretch', shear: 'Shear',
    rotate: 'Rotate', reflect: 'Reflect', flatten: 'Flatten'
  };

  /* The space unfolds from a small cube on first load, unless motion is reduced. */
  var cur = reduceMotion ? PRESETS.identity.slice() : [0.04, 0, 0, 0, 0.04, 0, 0, 0, 0.04];
  var tgt = PRESETS.identity.slice();

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function det3(m) {
    return m[0] * (m[4] * m[8] - m[5] * m[7]) -
           m[1] * (m[3] * m[8] - m[5] * m[6]) +
           m[2] * (m[3] * m[7] - m[4] * m[6]);
  }
  function fmt(v) { return (Math.abs(v) < 0.005 ? 0 : v).toFixed(2); }

  /* ---------- HUD ---------- */
  function noteFor(d) {
    if (Math.abs(d) < 0.1) return 'The cube is almost flat, so M has no inverse.';
    if (d < 0) return 'Orientation is flipped. Volume scaled by ' + Math.abs(d).toFixed(2) + '.';
    if (Math.abs(d - 1) < 0.02) return 'Volume unchanged.';
    return 'Volume scaled by ' + d.toFixed(2) + '.';
  }

  var lastHud = 0;
  function updateHud(now, force) {
    if (!force && now - lastHud < 60) return;
    lastHud = now;
    for (var i = 0; i < 9; i++) {
      if (document.activeElement !== inputs[i]) inputs[i].value = fmt(cur[i]);
    }
    var d = det3(cur);
    detEl.textContent = fmt(d);
    var note = noteFor(d);
    if (noteEl.textContent !== note) noteEl.textContent = note;
  }

  function matches(a, b) {
    for (var i = 0; i < 9; i++) if (Math.abs(a[i] - b[i]) > 1e-6) return false;
    return true;
  }
  function syncPresetState() {
    var any = null;
    for (var key in PRESETS) if (matches(tgt, PRESETS[key])) any = key;
    presetBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.preset === any)); });
  }

  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.dataset.preset;
      tgt = PRESETS[key].slice();
      syncPresetState();
      for (var i = 0; i < 9; i++) if (document.activeElement === inputs[i]) inputs[i].blur();
      if (reduceMotion) { cur = tgt.slice(); }
      updateHud(performance.now(), true);
      liveEl.textContent = PRESET_NAMES[key] + ' applied. Determinant ' + fmt(det3(tgt)) + '.';
      kick();
    });
  });

  inputs.forEach(function (input, i) {
    input.addEventListener('input', function () {
      var v = parseFloat(input.value);
      if (!isFinite(v)) return;
      tgt[i] = clamp(v, -3, 3);
      syncPresetState();
      if (reduceMotion) cur = tgt.slice();
      kick();
    });
    input.addEventListener('blur', function () { input.value = fmt(cur[i]); });
  });

  updateHud(0, true);
  syncPresetState();

  /* ---------- Three.js ---------- */
  var THREE = window.THREE;
  var renderer = null;
  try {
    if (!THREE) throw new Error('three.js did not load');
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    host.setAttribute('data-fallback', 'true');
    // Without WebGL the matrix panel still works as a calculator: snap values.
    var snap = function () { cur = tgt.slice(); updateHud(performance.now(), true); };
    presetBtns.forEach(function (b) { b.addEventListener('click', snap); });
    inputs.forEach(function (n) { n.addEventListener('input', snap); });
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  var CYAN = 0x27e8ff, MINT = 0x3df5a8, AMBER = 0xffcf5c;
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  var view = new THREE.Group();
  scene.add(view);
  var space = new THREE.Group();
  space.matrixAutoUpdate = false;
  view.add(space);

  /* Lattice points, coloured from cyan to mint across the diagonal. */
  (function buildLattice() {
    var n = 9, step = 0.5, half = (n - 1) * step / 2;
    var pos = new Float32Array(n * n * n * 3);
    var col = new Float32Array(n * n * n * 3);
    var c1 = new THREE.Color(CYAN), c2 = new THREE.Color(MINT), c = new THREE.Color();
    var k = 0;
    for (var x = 0; x < n; x++) for (var y = 0; y < n; y++) for (var z = 0; z < n; z++) {
      pos[k] = x * step - half; pos[k + 1] = y * step - half; pos[k + 2] = z * step - half;
      c.copy(c1).lerp(c2, (x + y + z) / (3 * (n - 1)));
      col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
      k += 3;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    var cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    var g = cv.getContext('2d');
    var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.8)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);

    var mat = new THREE.PointsMaterial({
      size: 0.085, vertexColors: true, map: new THREE.CanvasTexture(cv),
      transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending
    });
    space.add(new THREE.Points(geo, mat));
  })();

  /* Floor grid (x-z plane) in mint, back wall (x-y plane) in cyan. */
  function gridLines(color, opacity, plane) {
    var n = 9, step = 0.5, half = (n - 1) * step / 2, v = [];
    for (var i = 0; i < n; i++) {
      var t = i * step - half;
      if (plane === 'xz') { v.push(-half, -half, t, half, -half, t, t, -half, -half, t, -half, half); }
      else { v.push(-half, t, -half, half, t, -half, t, -half, -half, t, half, -half); }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity }));
  }
  space.add(gridLines(MINT, 0.22, 'xz'));
  space.add(gridLines(CYAN, 0.16, 'xy'));

  /* Unit cube from the origin: its image is the parallelepiped spanned by the columns of M. */
  (function buildCube() {
    var box = new THREE.BoxGeometry(2, 2, 2);
    box.translate(1, 1, 1);
    space.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(box),
      new THREE.LineBasicMaterial({ color: 0xe6fbff, transparent: true, opacity: 0.95 })
    ));
    space.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial({
      color: CYAN, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false
    })));
  })();

  /* Basis vectors: the columns of M, drawn in the untransformed view group. */
  var arrows = [CYAN, MINT, AMBER].map(function (c) {
    var a = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2, c, 0.34, 0.17);
    view.add(a);
    return a;
  });
  var tmpDir = new THREE.Vector3();
  function updateArrows() {
    for (var c = 0; c < 3; c++) {
      tmpDir.set(cur[c], cur[3 + c], cur[6 + c]).multiplyScalar(2);
      var len = tmpDir.length();
      if (len < 0.02) { arrows[c].visible = false; continue; }
      arrows[c].visible = true;
      arrows[c].setDirection(tmpDir.clone().normalize());
      arrows[c].setLength(len, Math.min(0.34, len * 0.6), Math.min(0.17, len * 0.3));
    }
  }

  /* Floating polyhedra around the edges. */
  var floaters = [];
  (function buildFloaters() {
    var defs = [
      { g: new THREE.IcosahedronGeometry(0.7, 0), p: [-4.6, 2.2, -2.5], c: CYAN },
      { g: new THREE.OctahedronGeometry(0.6, 0), p: [4.8, -1.8, -2.0], c: MINT },
      { g: new THREE.DodecahedronGeometry(0.55, 0), p: [-3.6, -2.6, -1.0], c: MINT },
      { g: new THREE.TetrahedronGeometry(0.65, 0), p: [3.9, 2.7, -3.2], c: CYAN },
      { g: new THREE.IcosahedronGeometry(0.4, 0), p: [0.6, 3.6, -3.5], c: MINT }
    ];
    defs.forEach(function (d, i) {
      var m = new THREE.LineSegments(
        new THREE.EdgesGeometry(d.g),
        new THREE.LineBasicMaterial({ color: d.c, transparent: true, opacity: 0.5 })
      );
      m.position.set(d.p[0], d.p[1], d.p[2]);
      m.userData = { y0: d.p[1], phase: i * 1.7, spin: 0.15 + i * 0.05 };
      scene.add(m);
      floaters.push(m);
    });
  })();

  /* ---------- Pointer orbit ---------- */
  var heroEl = document.getElementById('hero');
  var px = 0, py = 0, pxS = 0, pyS = 0, active = false, auto = 0.6, drag = 0, dragging = false, lastX = 0;

  heroEl.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') {
      if (dragging) { drag += (e.clientX - lastX) * 0.012; lastX = e.clientX; }
      return;
    }
    var r = host.getBoundingClientRect();
    px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
    active = true;
    kick();
  });
  heroEl.addEventListener('pointerleave', function () { active = false; });
  host.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') { dragging = true; lastX = e.clientX; }
  });
  window.addEventListener('pointerup', function () { dragging = false; });
  window.addEventListener('pointercancel', function () { dragging = false; });

  /* ---------- Sizing ---------- */
  var wide = window.matchMedia('(min-width: 1024px)');
  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    var aspect = w / h;
    camera.aspect = aspect;
    camera.position.set(0, 1.2, aspect < 1 ? 11 + (1 - aspect) * 6 : 12.2);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    view.position.set(wide.matches ? 2.9 : 0, wide.matches ? 0.7 : 0, 0);
    kick();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(host);
  else window.addEventListener('resize', resize);

  /* ---------- Loop ---------- */
  var running = false, raf = 0, last = 0, visible = true, t = 0;

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.max(0, Math.min((now - last) / 1000, 0.25));
    last = now;
    t += dt;

    // ease M toward the target
    var k = 1 - Math.exp(-dt * 5.5), moving = false;
    for (var i = 0; i < 9; i++) {
      var d = tgt[i] - cur[i];
      if (Math.abs(d) > 1e-4) { cur[i] += d * k; moving = true; } else { cur[i] = tgt[i]; }
    }
    space.matrix.set(
      cur[0], cur[1], cur[2], 0,
      cur[3], cur[4], cur[5], 0,
      cur[6], cur[7], cur[8], 0,
      0, 0, 0, 1
    );
    space.matrixWorldNeedsUpdate = true;
    updateArrows();
    updateHud(now, false);

    // orbit
    if (!reduceMotion && !active) auto += dt * 0.14;
    pxS += ((active ? px : 0) - pxS) * 0.06;
    pyS += ((active ? py : 0) - pyS) * 0.06;
    view.rotation.y = auto + pxS * 0.9 + drag;
    view.rotation.x = 0.28 + pyS * 0.35;

    if (!reduceMotion) {
      for (var f = 0; f < floaters.length; f++) {
        var m = floaters[f], u = m.userData;
        m.rotation.x += dt * u.spin;
        m.rotation.y += dt * u.spin * 1.3;
        m.position.y = u.y0 + Math.sin(t * 0.6 + u.phase) * 0.18;
      }
    }

    renderer.render(scene, camera);

    // In reduced-motion mode nothing moves on its own: stop once settled.
    if (reduceMotion && !moving && !active && Math.abs(pxS) < 0.001) { updateHud(now, true); stop(); }
  }

  function start() {
    if (!renderer || running || !visible || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }
  function kick() { start(); }
  window.kick = kick;

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { resize(); start(); } else { stop(); }
    }, { threshold: 0 }).observe(host);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
  if (wide.addEventListener) wide.addEventListener('change', resize);

  resize();
  start();
})();
