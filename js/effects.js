(function () {
  const ambientCanvas = document.getElementById("effects-ambient");
  const frontCanvas = document.getElementById("effects-front");
  if (!ambientCanvas || !frontCanvas) return;

  const COLORS = ["#ff5ba5", "#ff30c5", "#ff9ed2", "#ffd1e8"];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = () => COLORS[(Math.random() * COLORS.length) | 0];

  let W = 0;
  let H = 0;
  let actx;
  let fctx;
  let stars = [];
  let floaters = [];
  let shooters = [];
  let sparks = [];
  let rings = [];
  let lastX = null;
  let lastY = null;

  function fit(canvas) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return ctx;
  }

  function heart(ctx, x, y, size, rot) {
    const s = size / 16;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    ctx.beginPath();
    ctx.moveTo(0, -3.2 * s);
    ctx.bezierCurveTo(0, -6.4 * s, -6.2 * s, -7.2 * s, -7.4 * s, -2.4 * s);
    ctx.bezierCurveTo(-8.4 * s, 1.6 * s, -3.4 * s, 6.2 * s, 0, 9.4 * s);
    ctx.bezierCurveTo(3.4 * s, 6.2 * s, 8.4 * s, 1.6 * s, 7.4 * s, -2.4 * s);
    ctx.bezierCurveTo(6.2 * s, -7.2 * s, 0, -6.4 * s, 0, -3.2 * s);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    actx = fit(ambientCanvas);
    fctx = fit(frontCanvas);

    stars = [];
    const count = Math.max(70, Math.min(160, Math.round((W * H) / 12000)));
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.5, 1.8),
        a: rand(0.15, 0.7),
        p: Math.random() * Math.PI * 2,
        s: rand(0.4, 1.5),
        pink: Math.random() < 0.35,
      });
    }
  }

  function addFloater() {
    if (floaters.length > 24) return;
    floaters.push({
      x: Math.random() * W,
      y: H + rand(8, 48),
      vy: -rand(9, 22),
      sway: rand(8, 28),
      phase: Math.random() * Math.PI * 2,
      size: rand(4, 10),
      rot: rand(-0.5, 0.5),
      vr: rand(-0.35, 0.35),
      age: 0,
      life: rand(7, 12),
      color: pick(),
    });
  }

  function addShooter() {
    if (shooters.length > 1) return;
    const fromLeft = Math.random() < 0.5;
    shooters.push({
      x: fromLeft ? rand(-60, W * 0.15) : rand(W * 0.85, W + 60),
      y: rand(H * 0.06, H * 0.35),
      vx: (fromLeft ? 1 : -1) * rand(190, 280),
      vy: rand(70, 140),
      size: rand(6, 9.5),
      age: 0,
      life: rand(0.9, 1.3),
    });
  }

  function addSpark(x, y) {
    if (sparks.length > 160) return;
    sparks.push({
      x,
      y,
      vx: rand(-20, 20),
      vy: rand(-38, -8),
      size: rand(4, 9),
      rot: rand(-0.6, 0.6),
      vr: rand(-1.6, 1.6),
      age: 0,
      life: rand(0.7, 1.3),
      color: pick(),
    });
  }

  function addBurst(x, y) {
    if (sparks.length > 220) return;
    const count = 18 + ((Math.random() * 9) | 0);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = rand(60, 200);
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 24,
        size: rand(5, 13),
        rot: rand(-0.8, 0.8),
        vr: rand(-2.4, 2.4),
        age: 0,
        life: rand(0.85, 1.5),
        color: pick(),
      });
    }
    rings.push({ x, y, age: 0, life: 0.75, max: rand(60, 105) });
    if (rings.length > 6) rings.shift();
  }

  function update(dt) {
    for (const f of floaters) {
      f.age += dt;
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
    }
    floaters = floaters.filter((f) => f.age < f.life && f.y > -40);

    for (const s of shooters) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }
    shooters = shooters.filter((s) => s.age < s.life);

    for (const s of sparks) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 1 - 1.4 * dt;
      s.vy = s.vy * (1 - 1.1 * dt) - 18 * dt;
      s.rot += s.vr * dt;
    }
    sparks = sparks.filter((s) => s.age < s.life);

    for (const r of rings) r.age += dt;
    rings = rings.filter((r) => r.age < r.life);
  }

  function drawAmbient(t) {
    actx.clearRect(0, 0, W, H);
    actx.globalCompositeOperation = "lighter";

    for (const s of stars) {
      actx.globalAlpha = s.a * (0.55 + 0.45 * Math.sin(t * s.s + s.p));
      actx.fillStyle = s.pink ? "#ff9ed2" : "#ffffff";
      actx.beginPath();
      actx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      actx.fill();
    }

    for (const f of floaters) {
      actx.globalAlpha =
        Math.min(1, f.age / 1.5) * Math.min(1, (f.life - f.age) / 2.2) * 0.6;
      actx.fillStyle = f.color;
      heart(
        actx,
        f.x + Math.sin(f.phase + f.age * 0.7) * f.sway,
        f.y,
        f.size,
        f.rot
      );
    }

    for (const s of shooters) {
      const k = 1 - s.age / s.life;
      for (let i = 0; i < 7; i++) {
        const back = i * 0.03;
        if (s.age - back < 0) continue;
        actx.globalAlpha = k * (1 - i / 7) * 0.5;
        actx.fillStyle = "#ff5ba5";
        heart(
          actx,
          s.x - s.vx * back,
          s.y - s.vy * back,
          s.size * (1 - i * 0.1),
          0.3
        );
      }
    }

    actx.globalAlpha = 1;
    actx.globalCompositeOperation = "source-over";
  }

  function drawFront() {
    fctx.clearRect(0, 0, W, H);
    fctx.globalCompositeOperation = "lighter";

    for (const s of sparks) {
      const k = Math.max(0, 1 - s.age / s.life);
      fctx.globalAlpha = k * 0.16;
      fctx.fillStyle = s.color;
      fctx.beginPath();
      fctx.arc(s.x, s.y, s.size * 1.4, 0, Math.PI * 2);
      fctx.fill();
      fctx.globalAlpha = k * 0.95;
      fctx.fillStyle = s.color;
      heart(fctx, s.x, s.y, s.size * (0.6 + 0.4 * k), s.rot);
    }

    for (const r of rings) {
      const k = r.age / r.life;
      fctx.globalAlpha = (1 - k) * 0.55;
      fctx.strokeStyle = "#ff9ed2";
      fctx.lineWidth = 2 * (1 - k) + 0.4;
      fctx.beginPath();
      fctx.arc(r.x, r.y, r.max * (0.12 + 0.88 * k), 0, Math.PI * 2);
      fctx.stroke();
    }

    fctx.globalAlpha = 1;
    fctx.globalCompositeOperation = "source-over";
  }

  window.addEventListener(
    "pointermove",
    function (e) {
      if (lastX === null) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (dx * dx + dy * dy < 64) return;
      lastX = e.clientX;
      lastY = e.clientY;
      addSpark(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener(
    "pointerdown",
    function (e) {
      addBurst(e.clientX, e.clientY);
    },
    { passive: true }
  );

  window.addEventListener("resize", resize);
  resize();

  let last = performance.now();
  let floatTimer = 0;
  let shootTimer = 0;
  let nextShoot = rand(6, 10);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    floatTimer += dt;
    if (floatTimer > 0.65) {
      floatTimer = 0;
      addFloater();
    }

    shootTimer += dt;
    if (shootTimer > nextShoot) {
      shootTimer = 0;
      nextShoot = rand(7, 13);
      addShooter();
    }

    update(dt);
    drawAmbient(now / 1000);
    drawFront();

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();
