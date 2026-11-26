// The opening: a spiral of time rising slowly through the screen. On "Begin" the view tilts
// until you look straight down its axis; the spiral closes into a circle that lands exactly
// on the first ring of the dial, then dissolves into it.

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

export function intro(target) {
  return new Promise((resolve) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.createElement('div');
    el.className = 'intro';
    el.innerHTML = `<canvas></canvas>
      <div class="intro-top"><div class="intro-he" lang="he">הִנֵּנִי</div><div class="intro-en">Here I am · where are you in time?</div></div>
      <button type="button" class="intro-go">Begin</button>`;
    document.body.appendChild(el);
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    let W, H, dpr;
    const size = () => {
      dpr = Math.min(2, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    };
    size();
    addEventListener('resize', size);

    const t0 = performance.now();
    let phase = 'idle', start = 0, done = false;
    const goal = () => {
      const r = target.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, R: r.width * (173 / 460), w: r.width * (30 / 460) };
    };

    function frame(now) {
      if (done) return;
      const time = (now - t0) / 1000;
      let p = 0;
      if (phase === 'orient') p = Math.min(1, (now - start) / 2600);
      if (phase === 'gone') p = 1; // hold the landed ring while it fades; never snap back to the spiral
      const e = ease(p);
      const G = goal();
      const R0 = Math.min(W * 0.34, 170), cx = lerp(W / 2, G.cx, e), cy = lerp(H * 0.6, G.cy, e);
      const R = lerp(R0, G.R, e), band = lerp(R0 * 0.15, G.w, e);
      const phi = lerp(0.3, Math.PI / 2, e);                 // tilt: from nearly side-on to straight down the axis
      const pitch = lerp(R0 * 0.82, R0 * 0.02, e);            // the coils close up into one circle
      const f = R0 * 4.2, spin = time * 0.12, rise = (time * 0.07) % 1;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const turns = Math.min(9, Math.ceil((H * 1.3) / Math.max(pitch, 1)) + 2);
      const step = 0.04, pts = [];
      for (let t = -turns * Math.PI; t <= turns * Math.PI; t += step) {
        const a = t + spin, x = R * Math.cos(a), z = R * Math.sin(a);
        const y = ((t / (2 * Math.PI)) + rise) * pitch; // time rises
        const yv = y * Math.cos(phi) - z * Math.sin(phi), d = y * Math.sin(phi) + z * Math.cos(phi);
        const sc = f / (f + d);
        const X = cx + x * sc, Y = cy - yv * sc;
        // Fade at the screen's edges and under the title; as it turns, fade the coils that are not the ring.
        let al = Math.min(1, Math.min(Y - H * 0.24, H - Y) / (H * 0.16));
        if (e > 0) al *= 1 - e * Math.min(1, Math.max(0, -y / (R0 * 0.25)));
        if (e > 0) al *= 1 - e * 0.8 * Math.min(1, Math.max(0, y / (R0 * 0.6)));
        pts.push({ X, Y, sc, back: Math.sin(a) > 0, al: Math.max(0, al), t });
      }
      // Draw the far half of every coil first, then the near half, each as continuous ribbons.
      const runs = (back) => {
        const out = []; let cur = null;
        for (const q of pts) {
          if (q.sc <= 0 || q.sc > 3) { cur = null; continue; }
          if (q.back === back) { if (!cur) out.push((cur = [])); cur.push(q); } else cur = null;
        }
        return out;
      };
      ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      // Each half-coil is one unbroken ribbon; its fade toward the screen edges comes from a gradient along it.
      const strokeRuns = (back, color, k) => {
        for (const run of runs(back)) {
          if (run.length < 2) continue;
          const sc = run.reduce((a, q) => a + q.sc, 0) / run.length;
          const A = run[0], B = run[run.length - 1];
          const g = ctx.createLinearGradient(A.X, A.Y, B.X, B.Y);
          const base = back ? 0.45 + 0.4 * e : 1;
          [0, 0.25, 0.5, 0.75, 1].forEach((o) => { const q = run[Math.round(o * (run.length - 1))]; g.addColorStop(o, rgba(color, q.al * base)); });
          ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = band * sc * k; ctx.lineCap = 'round';
          ctx.beginPath(); run.forEach((q, j) => (j ? ctx.lineTo(q.X, q.Y) : ctx.moveTo(q.X, q.Y))); ctx.stroke();
        }
      };
      for (const back of [true, false]) {
        // The edge of the band in one pass, then its face in a second, so the ribbon reads as one piece.
        strokeRuns(back, back ? '#8f7040' : '#b08a4b', 1);
        strokeRuns(back, back ? '#c9b48a' : '#efdfb8', 0.72);
        // Hour marks on this half: 24 to a turn, every sixth larger.
        for (const q of pts) {
          if (q.back !== back || q.sc <= 0) continue;
          const k = Math.round(q.t / (Math.PI / 12));
          if (Math.abs(q.t - k * (Math.PI / 12)) > step / 2) continue;
          ctx.globalAlpha = q.al * (back ? 0.4 : 0.85);
          ctx.fillStyle = k % 6 === 0 ? '#7a5422' : '#a07a42';
          ctx.beginPath(); ctx.arc(q.X, q.Y, band * q.sc * (k % 6 === 0 ? 0.2 : 0.11), 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (phase === 'orient' && p >= 1) {
        phase = 'gone';
        el.classList.add('dissolve');
        setTimeout(() => { done = true; el.remove(); removeEventListener('resize', size); resolve(); }, 1100);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    el.querySelector('.intro-go').addEventListener('click', () => {
      if (phase !== 'idle') return;
      if (reduce) { done = true; el.remove(); resolve(); return; }
      phase = 'orient'; start = performance.now();
      el.classList.add('orienting');
    });
  });
}
