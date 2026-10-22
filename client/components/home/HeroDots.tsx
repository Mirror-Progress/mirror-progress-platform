import React, { useEffect, useRef } from "react";

// Hero motion chosen by Jahlon (Oct 15): a dotted ground field, part of which lifts into a detailed
// building, holds, then settles back. Dots part around the pointer and the building turns toward it.
// Shows one still frame (building formed) under reduced motion and pauses off screen.

const INK = "#002724";
const SIGNAL = "#00c2f4";
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const c = clamp01(x);
  return c * c * (3 - 2 * c);
};

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Building in world units, y up: plaza, colonnaded podium, main tower with floor plates and mullions,
// crown and mast, a twisting tower, and a trussed sky bridge between the two towers.
function buildModel(): Float32Array {
  const p: number[] = [];
  const line = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, step: number) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / step));
    for (let i = 0; i <= n; i++) {
      const f = i / n;
      p.push(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, z0 + (z1 - z0) * f);
    }
  };
  const ring = (cx: number, cz: number, hw: number, hd: number, y: number, step: number, rot = 0) => {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const k = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([a, b]) => [cx + a * c - b * s, cz + a * s + b * c]);
    for (let i = 0; i < 4; i++) line(k[i][0], y, k[i][1], k[(i + 1) % 4][0], y, k[(i + 1) % 4][1], step);
    return k;
  };
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, step: number) => {
    ring((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, y0, step);
    ring((x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2, y1, step);
    for (const [x, z] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) line(x, y0, z, x, y1, z, step);
  };

  // Plaza outline and paving grid.
  ring(0, 0, 9, 6, 0, 0.25);
  for (let x = -8; x <= 8; x += 1) line(x, 0, -5.5, x, 0, 5.5, 0.5);

  // Podium: floor edges, a colonnade on the two near faces, roof grid.
  for (const y of [0, 0.8, 1.6]) ring(-2, 0, 4, 3, y, 0.15);
  for (let z = -3; z <= 3.001; z += 0.5) line(2, 0, z, 2, 1.6, z, 0.12);
  for (let x = -6; x <= 2.001; x += 0.5) line(x, 0, 3, x, 1.6, 3, 0.12);
  for (let x = -5.5; x <= 1.5; x += 0.5) line(x, 1.6, -3, x, 1.6, 3, 0.3);

  // Main tower: floor plates every 0.45, corners, mullions on the near faces.
  const t0 = 1.6;
  const t1 = 10;
  for (let y = t0; y <= t1 + 0.001; y += 0.45) ring(-2.25, -0.25, 1.75, 1.75, y, 0.18);
  for (const [x, z] of [[-4, -2], [-0.5, -2], [-0.5, 1.5], [-4, 1.5]]) line(x, t0, z, x, t1, z, 0.1);
  for (let z = -1.5; z < 1.5; z += 0.5) line(-0.5, t0, z, -0.5, t1, z, 0.3);
  for (let x = -3.5; x < -0.5; x += 0.5) line(x, t0, 1.5, x, t1, 1.5, 0.3);

  // Crown setback, roof units and mast.
  for (let y = t1; y <= 10.9; y += 0.3) ring(-2.25, -0.25, 1.2, 1.2, y, 0.15);
  box(-3.2, -2.6, 10.9, 11.3, -1.1, -0.5, 0.12);
  box(-1.9, -1.4, 10.9, 11.2, 0.1, 0.6, 0.12);
  line(-2.25, 10.9, -0.25, -2.25, 12.6, -0.25, 0.1);

  // Twisting tower: each floor turns a little further; corners spiral between floors.
  let prev: number[][] | null = null;
  for (let i = 0, y = 0; y <= 7.2 + 0.001; i++, y += 0.45) {
    const k = ring(4.4, -0.8, 1.4, 1.4, y, 0.18, i * 0.06);
    if (prev) for (let c = 0; c < 4; c++) line(prev[c][0], y - 0.45, prev[c][1], k[c][0], y, k[c][1], 0.1);
    prev = k;
  }

  // Sky bridge with a diagonal truss on its near face.
  box(-0.5, 3.1, 5.4, 6.3, -1.2, 0.4, 0.12);
  for (let x = -0.5; x < 3.0; x += 0.7) {
    line(x, 5.4, 0.4, x + 0.35, 6.3, 0.4, 0.1);
    line(x + 0.35, 6.3, 0.4, Math.min(x + 0.7, 3.1), 5.4, 0.4, 0.1);
  }

  return new Float32Array(p);
}

export function HeroDots({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const model = buildModel();
    const n = model.length / 3;
    let cx = 0;
    let cz = 0;
    let maxY = 0;
    for (let i = 0; i < n; i++) {
      cx += model[i * 3];
      cz += model[i * 3 + 2];
      maxY = Math.max(maxY, model[i * 3 + 1]);
    }
    cx /= n;
    cz /= n;
    // Projected bounds at rest (unit scale), used to fit the building between headline and film.
    let minPX = Infinity;
    let maxPX = -Infinity;
    let minPY = Infinity;
    let maxPY = -Infinity;
    let minD = Infinity;
    let maxD = -Infinity;
    for (let i = 0; i < n; i++) {
      const dx = model[i * 3] - cx;
      const dz = model[i * 3 + 2] - cz;
      const px = (dx - dz) * 0.866;
      const py = -model[i * 3 + 1] + (dx + dz) * 0.5;
      minPX = Math.min(minPX, px);
      maxPX = Math.max(maxPX, px);
      minPY = Math.min(minPY, py);
      maxPY = Math.max(maxPY, py);
      minD = Math.min(minD, dx + dz);
      maxD = Math.max(maxD, dx + dz);
    }

    const r = rng(23);
    // Rise from the ground up; settle from the top down.
    const delay = new Float32Array(n);
    for (let i = 0; i < n; i++) delay[i] = (model[i * 3 + 1] / maxY) * 1.3 + r() * 0.25;

    // Ground field in perspective, with more points than the building so part of it always stays down.
    const cols = 120;
    const rows = Math.ceil((n * 1.35) / cols);
    const m = cols * rows;
    const fX = new Float32Array(m);
    const fZ = new Float32Array(m);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const k = j * cols + i;
        fX[k] = -14 + (28 * i) / (cols - 1) + (r() - 0.5) * 0.08;
        fZ[k] = 1 + (9 * j) / rows + (r() - 0.5) * 0.04;
      }
    const order = Array.from({ length: m }, (_, i) => i);
    for (let i = m - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    // Everything above the building: the headline and the button under it.
    const headline = document.getElementById("hero-copy") ?? document.getElementById("hero-title");
    let w = 0;
    let h = 0;
    let clear = 0;
    let raf = 0;
    let visible = true;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0, on: 0, target: 0, yaw: 0, tyaw: 0 };
    const start = performance.now();

    const measure = () => {
      clear = headline ? Math.max(0, headline.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top) : 0;
    };
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // Keep the building above the soft fade at the bottom of the hero.
      const fl = h - 56;
      const top = clear + 18;
      const availH = Math.max(60, fl - 18 - top);
      const s = Math.min(availH / ((maxPY - minPY) * 1.08), (w * 0.62) / (maxPX - minPX));
      const ox = w / 2 - ((minPX + maxPX) / 2) * s;
      const oy = top + availH / 2 - ((minPY + maxPY) / 2) * s;
      const yaw = 0.16 * Math.sin(t * 0.13) + pointer.yaw;
      const ca = Math.cos(yaw);
      const sa = Math.sin(yaw);
      const dot = Math.min(1, 0.5 + w / 1600);
      const hy = Math.max(20, clear * 0.85);
      const fb = fl + 70;
      const u = t % 16;
      const R = 90;

      const fieldAt = (k: number) => {
        const z = fZ[k];
        const edge = smooth((14 - Math.abs(fX[k])) / 5) * smooth((10 - z) / 4);
        return { x: w / 2 + (fX[k] * w * 0.075) / z, y: hy + (fb - hy) / z, a: (0.1 + 0.32 / z) * edge, size: 0.6 + 0.7 / z };
      };
      const plot = (x: number, y: number, a: number, size: number) => {
        if (pointer.on > 0.01) {
          const dx = x - pointer.x;
          const dy = y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const f = (1 - d / R) ** 2 * 26 * pointer.on;
            x += (dx / d) * f;
            y += (dy / d) * f;
          }
        }
        if (a < 0.01) return;
        ctx.globalAlpha = a;
        const rr = size * dot;
        ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
      };

      ctx.fillStyle = INK;
      // Field points that never lift.
      for (let q = n; q < m; q++) {
        const f = fieldAt(order[q]);
        plot(f.x, f.y, f.a, f.size);
      }
      // Field points that become the building.
      const signals: number[] = [];
      for (let i = 0; i < n; i++) {
        const f = fieldAt(order[i]);
        const e = smooth((u - 1.2 - delay[i]) / 2.2) * (1 - smooth((u - 12.5 - (1.55 - delay[i]) * 0.6) / 2.2));
        let x = f.x;
        let y = f.y;
        let a = f.a;
        let size = f.size;
        if (e > 0) {
          const dx = model[i * 3] - cx;
          const dz = model[i * 3 + 2] - cz;
          const rx = dx * ca - dz * sa;
          const rz = dx * sa + dz * ca;
          const bx = ox + (rx - rz) * 0.866 * s;
          const by = oy + (-model[i * 3 + 1] + (rx + rz) * 0.5) * s;
          const depth = clamp01((rx + rz - minD) / (maxD - minD));
          x += (bx - x) * e;
          y += (by - y) * e;
          a += (0.22 + depth * 0.6 - a) * e;
          size += (0.55 + depth * 0.45 - size) * e;
        }
        if (i % 397 === 0) signals.push(x, y, e);
        else plot(x, y, a, size);
      }
      ctx.fillStyle = SIGNAL;
      for (let k = 0; k < signals.length; k += 3) plot(signals[k], signals[k + 1], 0.4 + signals[k + 2] * 0.6, 1.4);
      ctx.globalAlpha = 1;
    };

    const running = () => visible && !reduce.matches;
    const loop = (now: number) => {
      pointer.x += (pointer.tx - pointer.x) * 0.18;
      pointer.y += (pointer.ty - pointer.y) * 0.18;
      pointer.on += (pointer.target - pointer.on) * 0.08;
      pointer.yaw += (pointer.tyaw - pointer.yaw) * 0.04;
      draw((now - start) / 1000);
      raf = running() ? requestAnimationFrame(loop) : 0;
    };
    const restart = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (running()) raf = requestAnimationFrame(loop);
      else {
        pointer.on = 0;
        pointer.yaw = 0;
        draw(8);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (reduce.matches) return;
      const rect = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
      const inside = pointer.tx >= 0 && pointer.tx <= rect.width && pointer.ty >= -40 && pointer.ty <= rect.height;
      pointer.target = inside ? 1 : 0;
      pointer.tyaw = inside ? (pointer.tx / rect.width - 0.5) * 0.5 : 0;
    };
    const onLeave = () => {
      pointer.target = 0;
      pointer.tyaw = 0;
    };

    resize();
    document.fonts?.ready.then(() => {
      measure();
      if (!raf) draw(8);
    });
    const onResize = () => {
      resize();
      if (!raf) draw(8);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    reduce.addEventListener("change", restart);
    const io = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible !== was) restart();
    });
    io.observe(canvas);
    restart();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      reduce.removeEventListener("change", restart);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
