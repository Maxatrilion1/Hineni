// The opening: a spiral of time turning slowly like a screw going down, so you feel yourself rising
// and the future keeps coming into view from above. On "Begin" the view tilts until you look straight
// down its axis; the spiral lies flat on the nested circles of time, and dissolves into them.

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixA = (h1, h2, t, a) => { const c1 = hex(h1), c2 = hex(h2); return `rgba(${c1.map((v, i) => Math.round(lerp(v, c2[i], t))).join(',')},${Math.max(0, Math.min(1, a)).toFixed(3)})`; };

const RISE = 1 / 18;   // coils per second the spiral slides down (the camera rising): one coil every 18 s
const TURN = 1 / 40;   // turns per second of its own gentle turn: one turn every 40 s
const ORIENT = 5;      // seconds for the tilt and landing
const TAU = Math.PI * 2;

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
      dpr = Math.min(1.5, devicePixelRatio || 1); W = innerWidth; H = innerHeight;
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    };
    size();
    addEventListener('resize', size);

    const goal = () => { const r = target.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, k: r.width / 460 }; };

    // Where each "now" dot must land: on coil i−3 of the flat spiral, at its circle's angle.
    // On the flat spiral a point at w sits at dial angle θ where 2πw ≡ −π/2 − θ.
    // a = 2π(w + phase); on the flat spiral x = R cos a, so dial angle θ needs a ≡ θ − π/2.
    const landAt = (ph) => dots.map((frac, i) => { let d = (frac - 0.25 - ph) - (i - 3); d -= Math.round(d); return i - 3 + d; });
    let land = landAt(0);

    const t0 = performance.now();
    let phase = 'idle', start = 0, s0 = 0, ph0 = 0, done = false, dotFrom = [], lastMask = '';

    function frame(now) {
      if (done) return;
      const time = (now - t0) / 1000;
      // s: how far the spiral has slid down; ph: the phase of a point's angle (slide + its own turn).
      let p = 0, s, ph;
      if (phase === 'idle') { s = time * RISE; ph = time * (RISE + TURN); }
      else {
        p = Math.min(1, (now - start) / 1000 / ORIENT);
        const k = ORIENT * (p - (p * p) / 2);          // both ease to a stop
        s = s0 + RISE * k; ph = ph0 + (RISE + TURN) * k;
      }
      const e = ease(p);
      const G = goal();
      const R0 = Math.min(W * 0.34, 170);
      const cx = lerp(W / 2, G.cx, e), cy = lerp(H * 0.6, G.cy, e);
      const band = lerp(R0 * 0.15, 15 * G.k, e);
      const phi = lerp(0.3, Math.PI / 2, e);
      const pitch0 = R0 * 0.82;
      // Each coil lands in its own time: the outer circles first, the inner ones after, more slowly.
      const eAt = (w) => { const o = Math.max(0, Math.min(1, (w + 3.4) / 6.8)); return ease(Math.max(0, Math.min(1, (p - 0.08 - 0.3 * o) / (0.55 + 0.07 * o)))); };
      const f = R0 * 4.2;
      const ringR = (w) => Math.max(0, 178 - 22 * (w + 3)) * G.k;

      // w is the position on the visible spiral (in turns); as the screw turns, the ribbon slides along w.
      const at = (w, R) => {
        const a = TAU * (w + ph), x = R * Math.cos(a), z = R * Math.sin(a), y = w * pitch0 * (1 - eAt(w));
        const yv = y * Math.cos(phi) - z * Math.sin(phi), d = y * Math.sin(phi) + z * Math.cos(phi), sc = f / (f + d);
        return { X: cx + x * sc, Y: cy - yv * sc, sc, far: Math.sin(a) > 0 };
      };
      const alphaAt = (w, Y) => {
        const edge = Math.max(0, Math.min(1, Math.min(Y - H * 0.24, H - Y) / (H * 0.16)));
        const out = w < -3.4 ? -3.4 - w : w > 3.4 ? w - 3.4 : 0;
        // Coils that will not become circles fade away early; the seven that will stay become solid.
        const keep = 1 - Math.min(1, out * 2) * Math.min(1, p * 3);
        return lerp(edge, 1, e) * keep;
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const step = 1 / 90, pts = [], wMax = phase === 'idle' ? 5.2 : 9;
      for (let w = -wMax; w <= wMax; w += step) {
        const q = at(w, lerp(R0, ringR(w), eAt(w)));
        q.al = alphaAt(w, q.Y); q.w = w;
        const out = w < -3.4 ? -3.4 - w : w > 3.4 ? w - 3.4 : 0;
        q.keep = 1 - Math.min(1, out * 2) * Math.min(1, p * 3);
        pts.push(q);
      }
      const runs = (far) => {
        const out = []; let cur = null;
        for (const q of pts) {
          if (q.sc <= 0 || q.sc > 3) { cur = null; continue; }
          if (q.far === far) { if (!cur) out.push((cur = [])); cur.push(q); } else cur = null;
        }
        return out;
      };
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const farK = lerp(0.45, 1, e);   // the far side brightens smoothly as you come to look straight down
      // Each half-coil is one continuous stroke; the fade at the screen's top and bottom is a single soft mask after.
      const stroke = (far, c1, c2, k) => {
        for (const run of runs(far)) {
          if (run.length < 2) continue;
          const q = run[run.length >> 1], al = q.keep * (far ? farK : 1);
          if (al <= 0.01) continue;
          ctx.strokeStyle = mixA(far ? c1 : c2, c2, e, al); ctx.lineWidth = band * q.sc * k;
          ctx.beginPath(); run.forEach((r, i) => (i ? ctx.lineTo(r.X, r.Y) : ctx.moveTo(r.X, r.Y))); ctx.stroke();
        }
      };
      for (const far of [true, false]) {
        stroke(far, '#8f7040', '#b08a4b', 1);
        stroke(far, '#c9b48a', '#efdfb8', 0.72);
        // Marks ride the ribbon: 24 to a turn, every sixth larger.
        const m0 = Math.ceil((-wMax + s) * 24), m1 = Math.floor((wMax + s) * 24);
        for (let m = m0; m <= m1; m++) {
          const w = m / 24 - s, q = at(w, lerp(R0, ringR(w), eAt(w)));
          if (q.far !== far || q.sc <= 0) continue;
          const al = alphaAt(w, q.Y) * (far ? farK * 0.5 : 0.85);
          if (al <= 0.01) continue;
          ctx.globalAlpha = al;
          ctx.fillStyle = m % 6 === 0 ? '#7a5422' : '#a07a42';
          ctx.beginPath(); ctx.arc(q.X, q.Y, band * q.sc * (m % 6 === 0 ? 0.2 : 0.11), 0, TAU); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // The seven "now" dots ride the ribbon too, each on its own coil, fading as it passes on;
      // on Begin each glides calmly along its coil to its circle's "now".
      dots.forEach((_, i) => {
        const cyc = (s + i * 0.37) % 1;                 // where it is in its slow pass down one coil
        const wIdle = land[i] + 0.5 - cyc, fIdle = Math.sin(Math.PI * cyc);
        const ed = eAt(i - 3), w = phase === 'idle' ? wIdle : lerp(dotFrom[i][0], land[i], ed);
        const fade = phase === 'idle' ? fIdle : lerp(dotFrom[i][1], 1, e);
        const q = at(w, lerp(R0, (178 - 22 * i) * G.k, ed));
        let al = alphaAt(Math.max(-3.4, Math.min(3.4, w)), q.Y) * fade * (q.far ? farK : 1);
        if (al <= 0.02) return;
        const r = lerp(band * q.sc * 0.22, 6 * G.k, e);
        ctx.globalAlpha = Math.min(1, al * lerp(0.4, 1, e));
        ctx.fillStyle = '#fbf6ea'; ctx.strokeStyle = '#a07a2c'; ctx.lineWidth = Math.max(1.4, r * 0.4);
        ctx.beginPath(); ctx.arc(q.X, q.Y, r, 0, TAU); ctx.fill(); ctx.stroke();
      });
      ctx.globalAlpha = 1;
      // Fade at the screen's top and bottom: a CSS mask on the canvas (drawn by the graphics chip), lifting as it lands.
      const ek = e.toFixed(3);
      if (ek !== lastMask) {
        lastMask = ek;
        const m = `linear-gradient(to bottom, rgba(0,0,0,${ek}) 0%, rgba(0,0,0,${ek}) 24%, #000 40%, #000 84%, rgba(0,0,0,${ek}) 100%)`;
        cv.style.webkitMaskImage = m; cv.style.maskImage = m;
      }

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
      if (reduce) { done = true; el.remove(); onLand?.(); resolve(); return; }
      const now = performance.now(), tt = (now - t0) / 1000;
      s0 = tt * RISE; ph0 = tt * (RISE + TURN);
      dotFrom = dots.map((_, i) => { const cyc = (s0 + i * 0.37) % 1; return [land[i] + 0.5 - cyc, Math.sin(Math.PI * cyc)]; });
      land = landAt(ph0 + (RISE + TURN) * ORIENT / 2);
      phase = 'orient'; start = now;
      el.classList.add('orienting');
    });
  });
}
