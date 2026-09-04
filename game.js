(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const BEST_KEY = "sky-dash-best";

  const state = {
    mode: "title",
    t: 0,
    score: 0,
    best: Number(localStorage.getItem(BEST_KEY) || 0),
    holding: false,
    ship: { x: 180, y: H / 2, vy: 0, r: 14 },
    towers: [],
    stars: [],
    spawn: 0,
  };

  for (let i = 0; i < 70; i++) {
    state.stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      s: 0.4 + Math.random() * 1.6,
      a: 0.3 + Math.random() * 0.7,
    });
  }

  function reset() {
    state.mode = "play";
    state.t = 0;
    state.score = 0;
    state.ship.x = 180;
    state.ship.y = H / 2;
    state.ship.vy = 0;
    state.towers = [];
    state.spawn = 0;
  }

  function spawnTower() {
    const gap = Math.max(110, 210 - state.score * 0.35);
    const top = 40 + Math.random() * (H - gap - 80);
    state.towers.push({
      x: W + 40,
      w: 62,
      top,
      gap,
      scored: false,
    });
  }

  function hit(ship, tower) {
    const left = tower.x;
    const right = tower.x + tower.w;
    const inX = ship.x + ship.r > left && ship.x - ship.r < right;
    if (!inX) return false;
    const inTop = ship.y - ship.r < tower.top;
    const inBot = ship.y + ship.r > tower.top + tower.gap;
    return inTop || inBot;
  }

  function update(dt) {
    state.t += dt;
    for (const star of state.stars) {
      star.x -= star.s * 40 * dt;
      if (star.x < 0) star.x = W;
    }

    if (state.mode !== "play") return;

    const thrust = state.holding ? -780 : 920;
    state.ship.vy += thrust * dt;
    state.ship.vy = Math.max(-420, Math.min(520, state.ship.vy));
    state.ship.y += state.ship.vy * dt;

    const speed = 220 + Math.min(180, state.score * 1.4);
    state.spawn -= dt;
    if (state.spawn <= 0) {
      spawnTower();
      state.spawn = Math.max(0.95, 1.7 - state.score * 0.012);
    }

    for (const tower of state.towers) {
      tower.x -= speed * dt;
      if (!tower.scored && tower.x + tower.w < state.ship.x) {
        tower.scored = true;
        state.score += 1;
      }
    }
    state.towers = state.towers.filter((t) => t.x + t.w > -20);

    const ship = state.ship;
    const crashed =
      ship.y - ship.r < 0 ||
      ship.y + ship.r > H ||
      state.towers.some((t) => hit(ship, t));

    if (crashed) {
      state.mode = "over";
      state.best = Math.max(state.best, state.score);
      localStorage.setItem(BEST_KEY, String(state.best));
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSky() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#0a1c2e");
    g.addColorStop(0.55, "#12324a");
    g.addColorStop(1, "#071018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    for (const star of state.stars) {
      ctx.fillStyle = `rgba(220, 240, 255, ${star.a})`;
      ctx.fillRect(star.x, star.y, star.s, star.s);
    }

    ctx.fillStyle = "rgba(92, 225, 230, 0.08)";
    ctx.beginPath();
    ctx.ellipse(W * 0.75, 90, 180, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTowers() {
    for (const tower of state.towers) {
      const accent = ctx.createLinearGradient(tower.x, 0, tower.x + tower.w, 0);
      accent.addColorStop(0, "#1d4f6a");
      accent.addColorStop(0.5, "#5ce1e6");
      accent.addColorStop(1, "#173a52");

      ctx.fillStyle = accent;
      ctx.fillRect(tower.x, 0, tower.w, tower.top);
      ctx.fillRect(tower.x, tower.top + tower.gap, tower.w, H - (tower.top + tower.gap));

      ctx.fillStyle = "#7cf0f4";
      ctx.fillRect(tower.x, tower.top - 10, tower.w, 10);
      ctx.fillRect(tower.x, tower.top + tower.gap, tower.w, 10);
    }
  }

  function drawShip() {
    const { x, y, vy, r } = state.ship;
    const tilt = Math.max(-0.45, Math.min(0.55, vy / 700));
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);

    ctx.fillStyle = "rgba(92, 225, 230, 0.35)";
    ctx.beginPath();
    ctx.ellipse(-r - 8, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8f4ff";
    ctx.beginPath();
    ctx.moveTo(r + 4, 0);
    ctx.lineTo(-r, r * 0.85);
    ctx.lineTo(-r + 4, 0);
    ctx.lineTo(-r, -r * 0.85);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#5ce1e6";
    ctx.beginPath();
    ctx.arc(2, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHud() {
    ctx.fillStyle = "#e8f4ff";
    ctx.font = "700 28px Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(state.score), 24, 42);
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.fillStyle = "#8fb0c8";
    ctx.fillText("BEST " + state.best, 24, 64);
  }

  function drawOverlay(title, sub) {
    ctx.fillStyle = "rgba(7, 16, 24, 0.55)";
    ctx.fillRect(0, 0, W, H);
    roundRect(W / 2 - 220, H / 2 - 90, 440, 180, 16);
    ctx.fillStyle = "rgba(12, 26, 38, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "#5ce1e6";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#e8f4ff";
    ctx.textAlign = "center";
    ctx.font = "700 36px Segoe UI, sans-serif";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.fillStyle = "#8fb0c8";
    ctx.font = "16px Segoe UI, sans-serif";
    ctx.fillText(sub, W / 2, H / 2 + 22);
    ctx.fillStyle = "#5ce1e6";
    ctx.font = "14px Segoe UI, sans-serif";
    ctx.fillText("Press Space or click to start", W / 2, H / 2 + 56);
  }

  function draw() {
    drawSky();
    drawTowers();
    if (state.mode !== "title") drawShip();
    drawHud();
    if (state.mode === "title") {
      drawOverlay("SKY DASH", "Hold to climb · release to dive");
    } else if (state.mode === "over") {
      drawOverlay("CRASHED", "Score " + state.score + " · Best " + state.best);
    }
  }

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function press() {
    state.holding = true;
    if (state.mode !== "play") reset();
  }
  function release() {
    state.holding = false;
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      press();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
      e.preventDefault();
      release();
    }
  });
  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    press();
  });
  window.addEventListener("pointerup", release);
})();
