// The opening: a spiral of time rising slowly through the screen. On "Begin" the view tilts
// until you look straight down its axis; the spiral closes into a circle that lands exactly
// on the first ring of the dial, then dissolves into it.

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const rgba = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

export function intro(target, { onLand, dots = [] } = {}) {
  return new Promise((resolve) => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const el = document.createElement('div');
    el.className = 'intro';
    el.innerHTML = `<canvas></canvas>
      <div class="intro-top"><div class="intro-he" lang="he">הִנֵּנִי</div><div class="intro-en">Orienting in Jewish space and time</div></div>
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
    let phase = 'idle', start = 0, done = false, spinAt = 0, riseAt = 0, spinFrom = 0;
    const cFinal = [];
    const goal = () => {
      const r = target.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, k: r.width / 460 };
    };

    function frame(now) {
      if (done) return;
      const time = (now - t0) / 1000;
      let p = 0;
      if (phase === 'orient') p = Math.min(1, (now - start) / 3800);
      if (phase === 'gone') p = 1; // hold the landed shape while it fades; never snap back to the spiral
      const e = ease(p);
      const G = goal();
      const R0 = Math.min(W * 0.34, 170), cx = lerp(W / 2, G.cx, e), cy = lerp(H * 0.6, G.cy, e);
      // Landing: the coils flatten into a spiral lying on the nested circles of time (radii 178, 156 … 46).
      const ringR = (c) => Math.max(0, 178 - 22 * (c + 3)) * G.k;
      const band = lerp(R0 * 0.15, 15 * G.k, e);
      const phi = lerp(0.3, Math.PI / 2, e);                 // tilt: from nearly side-on to straight down the axis
      const pitch = lerp(R0 * 0.82, 0, e);
      const f = R0 * 4.2;
      if (phase === 'idle') { spinAt = time * 0.05; riseAt = (1 - ((time * 0.025) % 1)) % 1; } // slow; the spiral travels down, so you rise through time
      else spinAt = spinFrom + 0.05 * 3.8 * (p - (p * p) / 2); // eases to a stop, never backwards
      const spin = spinAt, rise = riseAt;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const turns = 9;
      const step = 0.04, pts = [];
      for (let t = -turns * Math.PI; t <= turns * Math.PI; t += step) {
        const c = t / (2 * Math.PI) + rise;                  // which coil; time rises with c
        const R = lerp(R0, ringR(c), e);
        const a = t + spin, x = R * Math.cos(a), z = R * Math.sin(a);
        const y = c * pitch;
        const yv = y * Math.cos(phi) - z * Math.sin(phi), d = y * Math.sin(phi) + z * Math.cos(phi);
        const sc = f / (f + d);
        const X = cx + x * sc, Y = cy - yv * sc;
        let al = 1 - e;                                       // fade at the screen's edges and under the title while it is a spiral
        al = al * Math.min(1, Math.min(Y - H * 0.24, H - Y) / (H * 0.16)) + e;
        const out = c < -3.4 ? -3.4 - c : c > 3.4 ? c - 3.4 : 0; // as it lands, keep only the seven coils that become the circles
        al *= 1 - e * Math.min(1, out * 2);
        pts.push({ X, Y, sc, back: e < 0.5 && Math.sin(a) > 0, al: Math.max(0, Math.min(1, al)), t });
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
        for (const whole of runs(back)) for (let j0 = 0; j0 < whole.length - 1; j0 += 36) {
          const run = whole.slice(j0, j0 + 37); // short pieces, so each one's fade follows the ribbon
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
      // The seven "now" dots. Each rides its own coil; during the turn it glides along the coil
      // so that, when the spiral lies flat, it sits exactly on its circle's "now" dot.
      dots.forEach((frac, i) => {
        const cIdle = i - 3 + ((frac + 0.37 * i) % 1) - 0.5;   // somewhere on its coil while idle
        let c = cIdle;
        if (cFinal[i] != null) c = lerp(cIdle, cFinal[i], e);
        const t = 2 * Math.PI * (c - rise), a = t + spin;
        const R = lerp(R0, (178 - 22 * i) * G.k, e), x = R * Math.cos(a), z = R * Math.sin(a), y = c * pitch;
        const yv = y * Math.cos(phi) - z * Math.sin(phi), d = y * Math.sin(phi) + z * Math.cos(phi), sc = f / (f + d);
        const X = cx + x * sc, Y = cy - yv * sc;
        let al = (1 - e) * Math.min(1, Math.min(Y - H * 0.24, H - Y) / (H * 0.16)) + e;
        if (e < 0.5 && Math.sin(a) > 0) al *= 0.45;
        if (al <= 0.02) return;
        const r = lerp(band * sc * 0.42, 6 * G.k, e);
        ctx.globalAlpha = Math.max(0, Math.min(1, al));
        ctx.fillStyle = '#fbf6ea'; ctx.strokeStyle = '#a07a2c'; ctx.lineWidth = Math.max(1.5, r * 0.4);
        ctx.beginPath(); ctx.arc(X, Y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });
      ctx.globalAlpha = 1;

      if (phase === 'orient' && p >= 1) {
        phase = 'gone';
        el.classList.add('dissolve');
        onLand?.();
        setTimeout(() => { done = true; el.remove(); removeEventListener('resize', size); resolve(); }, 1600);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    el.querySelector('.intro-go').addEventListener('click', () => {
      if (phase !== 'idle') return;
      if (reduce) { done = true; el.remove(); resolve(); return; }
      phase = 'orient'; start = performance.now(); spinFrom = spinAt;
      // Where each dot must end: on coil i-3, at the angle of its circle's "now" (0 = top, clockwise).
      // On the flat spiral, angle a maps to the dial as a = θ − 90°; the spin ends where it started.
      dots.forEach((frac, i) => {
        const theta = frac * 2 * Math.PI, a = theta - Math.PI / 2;
        const cIdle = i - 3 + ((frac + 0.37 * i) % 1) - 0.5;
        let c = (a - (spinFrom + 0.05 * 3.8 * 0.5)) / (2 * Math.PI) + riseAt;       // one solution; shift by whole turns to the nearest
        c += Math.round(cIdle - c);
        cFinal[i] = c;
      });
      el.classList.add('orienting');
    });
  });
}
