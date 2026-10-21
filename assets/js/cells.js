// Hero background: a field of fluorescent "cells" that drift, grow and divide.
// Purely decorative (no data). Colors follow a Cell Painting composite:
// blue nuclei with green or magenta cytoplasm, taken from Figure 1.
// Honors prefers-reduced-motion (one still frame) and pauses off-screen.
(() => {
  "use strict";

  const canvas = document.querySelector(".cells");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const CYTOPLASM = [[62, 207, 142], [232, 91, 184], [79, 163, 232]];
  const NUCLEUS = "rgba(120, 160, 255, 0.62)";
  const AREA_PER_CELL = 17000; // px^2 of hero per cell
  const MAX_CELLS = 72;
  const R_MIN = 15;
  const R_DIVIDE = 36;
  const POINTS = 30; // vertices per membrane outline

  let cells = [];
  let width = 0;
  let height = 0;
  let target = 0;
  let frame = 0;
  let running = false;
  let onScreen = true;

  const rand = (a, b) => a + Math.random() * (b - a);

  function makeCell(x, y, r, alpha) {
    return {
      x, y, r,
      vx: rand(-0.12, 0.12),
      vy: rand(-0.12, 0.12),
      grow: rand(0.003, 0.008),
      color: CYTOPLASM[(Math.random() * CYTOPLASM.length) | 0],
      phase: rand(0, Math.PI * 2),
      lobes: 2 + ((Math.random() * 3) | 0),
      nucleus: rand(0.3, 0.42),
      alpha,
      fade: alpha < 1 ? 1 : 0, // +1 fading in, -1 fading out, 0 steady
    };
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    target = Math.max(16, Math.min(MAX_CELLS, Math.round((width * height) / AREA_PER_CELL)));
    if (cells.length === 0) {
      cells = Array.from({ length: target }, () =>
        makeCell(rand(0, width), rand(0, height), rand(R_MIN, R_DIVIDE - 2), 1));
    }
  }

  function divide(c) {
    const angle = rand(0, Math.PI);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const r = c.r * 0.72;
    const a = makeCell(c.x + dx * r * 0.6, c.y + dy * r * 0.6, r, 1);
    const b = makeCell(c.x - dx * r * 0.6, c.y - dy * r * 0.6, r, 1);
    a.color = b.color = c.color;
    a.vx = c.vx + dx * 0.25; a.vy = c.vy + dy * 0.25;
    b.vx = c.vx - dx * 0.25; b.vy = c.vy - dy * 0.25;
    return [a, b];
  }

  function update() {
    const next = [];
    for (const c of cells) {
      c.vx = (c.vx + rand(-0.01, 0.01)) * 0.992;
      c.vy = (c.vy + rand(-0.01, 0.01)) * 0.992;
      c.x += c.vx;
      c.y += c.vy;
      const m = c.r * 1.3;
      if (c.x < -m) c.x = width + m; else if (c.x > width + m) c.x = -m;
      if (c.y < -m) c.y = height + m; else if (c.y > height + m) c.y = -m;

      if (c.fade !== 0) {
        c.alpha += c.fade * 0.006;
        if (c.alpha >= 1) { c.alpha = 1; c.fade = 0; }
        if (c.alpha <= 0) continue; // faded out: drop it
      }
      if (c.r < R_DIVIDE + 2) c.r += c.grow;
      if (c.fade === 0 && c.r > R_DIVIDE && Math.random() < 0.004) {
        next.push(...divide(c));
      } else {
        next.push(c);
      }
    }
    cells = next;

    // Keep the population near its target: fade out extras, fade in newcomers.
    const steady = cells.filter((c) => c.fade === 0);
    if (cells.length > target * 1.1 && steady.length) {
      steady[(Math.random() * steady.length) | 0].fade = -1;
    } else if (cells.length < target) {
      cells.push(makeCell(rand(0, width), rand(0, height), rand(R_MIN, R_MIN + 6), 0));
    }
  }

  function outline(c, t) {
    ctx.beginPath();
    for (let i = 0; i <= POINTS; i++) {
      const a = (i / POINTS) * Math.PI * 2;
      const wobble = 1
        + 0.09 * Math.sin(c.lobes * a + c.phase + t * 0.00045)
        + 0.05 * Math.sin(2 * a - c.phase - t * 0.0003);
      const x = c.x + Math.cos(a) * c.r * wobble;
      const y = c.y + Math.sin(a) * c.r * wobble;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function draw(t) {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    for (const c of cells) {
      const [r, g, b] = c.color;
      const k = c.alpha;
      outline(c, t);
      const fill = ctx.createRadialGradient(c.x, c.y, c.r * 0.2, c.x, c.y, c.r * 1.15);
      fill.addColorStop(0, `rgba(${r},${g},${b},${0.3 * k})`);
      fill.addColorStop(1, `rgba(${r},${g},${b},${0.04 * k})`);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.45 * k})`;
      ctx.stroke();

      ctx.globalAlpha = k;
      ctx.beginPath();
      ctx.arc(c.x + Math.sin(t * 0.0006 + c.phase) * 1.2, c.y, c.r * c.nucleus, 0, Math.PI * 2);
      ctx.fillStyle = NUCLEUS;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = "source-over";
  }

  function tick(t) {
    if (!running) return;
    update();
    draw(t);
    frame = requestAnimationFrame(tick);
  }

  function sync() {
    const shouldRun = !motion.matches && onScreen && !document.hidden;
    if (shouldRun && !running) {
      running = true;
      frame = requestAnimationFrame(tick);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
    if (!running) draw(performance.now());
  }

  resize();
  draw(0);
  new ResizeObserver(() => { resize(); if (!running) draw(performance.now()); }).observe(canvas);
  new IntersectionObserver((entries) => {
    onScreen = entries[0].isIntersecting;
    sync();
  }).observe(canvas);
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  sync();
})();
