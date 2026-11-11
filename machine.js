/* ==========================================================================
   machine.js
   Toy 01 —— 无用机器：你打开，手臂伸出来把它关掉
   Toy 02 —— 拾光：四十五秒，用船头的一盏灯接住落下的光点
   ========================================================================== */

/* ---------------------------------------------------------------- Toy 01 */
(function () {
  "use strict";

  var sw = document.getElementById("switchBtn");
  var arm = document.getElementById("arm");
  var note = document.getElementById("machineNote");
  var countEl = document.getElementById("machineCount");
  if (!sw || !arm) return;

  var busy = false;
  var count = 0;

  var lines = [
    "它完成了它的工作。",
    "再一次。它并不介意重复。",
    "它不恨你，这只是职责所在。",
    "你按，它关。世界因此完整了一点点。",
    "这一下，算你今天做的无用功。",
    "很好。什么也没有发生。",
    "它把「开」这件事，还给了「关」。",
    "如果所有问题都这么好解决就好了。"
  ];
  var lastLine = -1;

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function nextLine() {
    var i = lastLine;
    while (i === lastLine) i = Math.floor(Math.random() * lines.length);
    lastLine = i;
    return lines[i];
  }

  async function cycle() {
    if (busy) return;
    busy = true;

    sw.setAttribute("aria-checked", "true");
    sw.setAttribute("aria-label", "开关，已打开");
    note.textContent = "……";

    await wait(620);

    arm.classList.add("is-out");
    await wait(760);

    arm.classList.add("is-tap");
    await wait(170);

    sw.setAttribute("aria-checked", "false");
    sw.setAttribute("aria-label", "开关，按一下打开");
    count += 1;
    if (countEl) countEl.textContent = String(count);
    note.textContent = nextLine();

    await wait(150);
    arm.classList.remove("is-tap");
    await wait(360);
    arm.classList.remove("is-out");
    await wait(620);

    busy = false;
  }

  sw.addEventListener("click", cycle);
  sw.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cycle();
    }
  });
})();

/* ---------------------------------------------------------------- Toy 02 */
(function () {
  "use strict";

  var canvas = document.getElementById("gameCanvas");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var overlay = document.getElementById("gameOverlay");
  var startBtn = document.getElementById("startBtn");
  var ovTitle = document.getElementById("ovTitle");
  var ovText = document.getElementById("ovText");
  var ovScore = document.getElementById("ovScore");
  var hudTime = document.getElementById("hudTime");
  var hudLights = document.getElementById("hudLights");
  var hudBest = document.getElementById("hudBest");

  var DURATION = 45;
  var W = 0;
  var H = 0;

  var game = {
    running: false,
    time: DURATION,
    lights: 0,
    best: 0,
    elapsed: 0,
    lastSpawn: 0,
    px: 0,
    tx: 0,
    vx: 0,
    dots: [],
    sparks: []
  };

  try {
    game.best = parseInt(localStorage.getItem("sw-best") || "0", 10) || 0;
  } catch (e) {}
  if (hudBest) hudBest.textContent = String(game.best);

  function palette() {
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    if (dark) {
      return {
        skyTop: "#171d20",
        skyBot: "#1e272a",
        water: "#121a1d",
        horizon: "rgba(157,184,192,0.34)",
        wave: "rgba(157,184,192,0.16)",
        moon: "#f2ebdb",
        glow: "rgba(242,235,219,0.13)",
        glowFade: "rgba(242,235,219,0)",
        dot: "#d9ab7d",
        boat: "#cfc7b6",
        ripple: "rgba(217,171,125,0.55)",
        land: "rgba(9,14,16,0.9)",
        shine: "rgba(242,235,219,0.3)"
      };
    }
    return {
      skyTop: "#f7f2e7",
      skyBot: "#e6ece7",
      water: "#dfe8e3",
      horizon: "rgba(138,162,164,0.45)",
      wave: "rgba(138,162,164,0.22)",
      moon: "#fdf8ec",
      glow: "rgba(255,251,240,0.55)",
      glowFade: "rgba(255,251,240,0)",
      dot: "#bf8c58",
      boat: "#3f565f",
      ripple: "rgba(191,140,88,0.55)",
      land: "rgba(138,162,164,0.3)",
      shine: "rgba(255,253,244,0.8)"
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!game.px) {
      game.px = W / 2;
      game.tx = W / 2;
    }
    needsDraw = true;
  }

  var resizeQueued = false;
  window.addEventListener("resize", function () {
    if (resizeQueued) return;
    resizeQueued = true;
    window.requestAnimationFrame(function () {
      resizeQueued = false;
      resize();
    });
  });

  /* ---------------------------------------------------------- 输入 */
  function moveTo(clientX) {
    var rect = canvas.getBoundingClientRect();
    game.tx = Math.max(36, Math.min(W - 36, clientX - rect.left));
  }

  canvas.addEventListener("pointermove", function (e) {
    moveTo(e.clientX);
  });

  canvas.addEventListener("pointerdown", function (e) {
    moveTo(e.clientX);
  });

  canvas.addEventListener(
    "touchmove",
    function (e) {
      if (game.running) e.preventDefault();
    },
    { passive: false }
  );

  document.addEventListener("keydown", function (e) {
    var target = e.target;
    if (target && /INPUT|TEXTAREA|SELECT/.test(target.tagName)) return;

    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      game.tx = Math.max(36, game.tx - 44);
      e.preventDefault();
    } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      game.tx = Math.min(W - 36, game.tx + 44);
      e.preventDefault();
    } else if (e.key === " " || e.code === "Space") {
      if (!game.running) {
        e.preventDefault();
        start();
      }
    }
  });

  /* ---------------------------------------------------------- 逻辑 */
  function spawnGap() {
    return 0.58 - Math.min(0.3, (game.elapsed / DURATION) * 0.3);
  }

  function spawn() {
    game.dots.push({
      x: 30 + Math.random() * (W - 60),
      y: -12,
      vy: (H / 400) * (58 + Math.random() * 46),
      r: 2.4 + Math.random() * 1.8,
      seed: Math.random() * 1000,
      sway: 8 + Math.random() * 12
    });
  }

  function lineFor(n) {
    if (n <= 4) return "今晚的光很少，但你每一颗都看见了。";
    if (n <= 9) return "你接住了光，也没有想着要照亮谁。";
    if (n <= 15) return "海面很安静，你已经很久没有这样专注过了。";
    return "你收集了一整片夜。它属于你，不必给任何人看。";
  }

  function start() {
    resize();
    game.running = true;
    game.time = DURATION;
    game.lights = 0;
    game.elapsed = 0;
    game.lastSpawn = 0;
    game.dots = [];
    game.sparks = [];
    game.px = W / 2;
    game.tx = W / 2;
    overlay.hidden = true;
    if (hudTime) hudTime.textContent = String(DURATION);
    if (hudLights) hudLights.textContent = "0";
  }

  function end() {
    game.running = false;
    if (game.lights > game.best) {
      game.best = game.lights;
      try {
        localStorage.setItem("sw-best", String(game.best));
      } catch (e) {}
    }
    if (hudBest) hudBest.textContent = String(game.best);

    ovTitle.textContent = "四十五秒";
    ovScore.hidden = false;
    ovScore.innerHTML = game.lights + "<small>光点</small>";
    ovText.textContent = lineFor(game.lights);
    startBtn.textContent = "再来一次";
    overlay.hidden = false;
    needsDraw = true;
  }

  if (startBtn) startBtn.addEventListener("click", start);

  /* ---------------------------------------------------------- 更新 */
  function update(dt) {
    var ease = Math.min(1, dt * 13);
    game.px += (game.tx - game.px) * ease;

    // 涟漪
    for (var s = game.sparks.length - 1; s >= 0; s--) {
      game.sparks[s].life += dt;
      if (game.sparks[s].life > 0.8) game.sparks.splice(s, 1);
    }

    if (!game.running) return;

    game.time -= dt;
    game.elapsed += dt;

    if (game.time <= 0) {
      game.time = 0;
      end();
      return;
    }

    if (game.elapsed - game.lastSpawn > spawnGap()) {
      game.lastSpawn = game.elapsed;
      spawn();
    }

    var catchY = H - 74;
    for (var i = game.dots.length - 1; i >= 0; i--) {
      var d = game.dots[i];
      d.y += d.vy * dt;

      var dx = Math.abs(d.x + Math.sin((d.y + d.seed) / 46) * d.sway - game.px);
      if (d.y > catchY - 22 && d.y < catchY + 16 && dx < 34) {
        game.dots.splice(i, 1);
        game.lights += 1;
        game.sparks.push({ x: game.px, y: catchY - 6, life: 0 });
        if (hudLights) hudLights.textContent = String(game.lights);
        continue;
      }

      if (d.y > H + 24) game.dots.splice(i, 1);
    }

    if (hudTime) hudTime.textContent = String(Math.ceil(game.time));
  }

  /* ---------------------------------------------------------- 绘制 */
  function draw() {
    if (!W || !H) return;
    var p = palette();
    var horizon = H * 0.62;

    var sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, p.skyTop);
    sky.addColorStop(1, p.skyBot);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    // 月亮
    var mx = W - 54;
    var my = H * 0.2;
    var glow = ctx.createRadialGradient(mx, my, 0, mx, my, 62);
    glow.addColorStop(0, p.glow);
    glow.addColorStop(1, p.glowFade);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(mx, my, 62, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.moon;
    ctx.beginPath();
    ctx.arc(mx, my, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = p.horizon;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 海面
    var water = ctx.createLinearGradient(0, horizon, 0, H);
    water.addColorStop(0, p.water);
    water.addColorStop(1, p.skyBot);
    ctx.fillStyle = water;
    ctx.fillRect(0, horizon, W, H - horizon);

    // 远岸
    ctx.fillStyle = p.land;
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(0, horizon - 16);
    ctx.quadraticCurveTo(W * 0.07, horizon - 34, W * 0.15, horizon - 17);
    ctx.quadraticCurveTo(W * 0.21, horizon - 6, W * 0.27, horizon);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = p.horizon;
    ctx.beginPath();
    ctx.moveTo(0, horizon + 0.5);
    ctx.lineTo(W, horizon + 0.5);
    ctx.stroke();

    // 月光的倒影
    ctx.fillStyle = p.shine;
    for (var m = 0; m < 4; m++) {
      var ry = horizon + 12 + m * 13;
      var rw = 26 - m * 4;
      var roff = Math.sin(game.elapsed * 0.8 + m) * 4;
      ctx.fillRect(mx - rw / 2 + roff, ry, rw, 2);
    }

    // 水波
    ctx.strokeStyle = p.wave;
    ctx.lineWidth = 1;
    var steps = 6;
    for (var i = 0; i < steps; i++) {
      var y = horizon + 16 + i * ((H - horizon - 34) / steps);
      var off = Math.sin(game.elapsed * 0.5 + i * 1.6) * 9;
      var len = W * (0.1 + ((i * 37) % 10) / 55);
      var x1 = (((i * 113) % 58) / 100) * W + off;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.lineTo(x1 + len, y);
      ctx.moveTo(W - x1 - len * 0.62, y + 4);
      ctx.lineTo(W - x1, y + 4);
      ctx.stroke();
    }

    // 光点
    ctx.fillStyle = p.dot;
    for (var j = 0; j < game.dots.length; j++) {
      var d = game.dots[j];
      var x = d.x + Math.sin((d.y + d.seed) / 46) * d.sway;
      ctx.globalAlpha = 0.22;
      ctx.beginPath();
      ctx.arc(x, d.y, d.r * 3.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 涟漪
    for (var k = 0; k < game.sparks.length; k++) {
      var sp = game.sparks[k];
      var t = sp.life / 0.8;
      ctx.globalAlpha = (1 - t) * 0.8;
      ctx.strokeStyle = p.ripple;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 6 + t * 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 船与灯
    var boatY = H - 52;
    var lampY = boatY - 20;

    var lamp = ctx.createRadialGradient(game.px, lampY, 0, game.px, lampY, 74);
    lamp.addColorStop(0, "rgba(233,193,142,0.5)");
    lamp.addColorStop(1, "rgba(233,193,142,0)");
    ctx.fillStyle = lamp;
    ctx.beginPath();
    ctx.arc(game.px, lampY, 74, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = p.boat;
    ctx.lineWidth = 1.6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(game.px - 30, boatY);
    ctx.quadraticCurveTo(game.px, boatY + 16, game.px + 30, boatY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(game.px, boatY - 2);
    ctx.lineTo(game.px, boatY - 18);
    ctx.stroke();

    ctx.fillStyle = "#e9c18e";
    ctx.beginPath();
    ctx.arc(game.px, lampY, 4.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = p.boat;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(game.px, lampY, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  /* ---------------------------------------------------------- 主循环 */
  var last = 0;
  var needsDraw = true;

  function frame(t) {
    if (!last) last = t;
    var dt = Math.min((t - last) / 1000, 0.05);
    last = t;

    if (game.running) {
      update(dt);
      draw();
    } else if (needsDraw) {
      // 未开始时只画一帧，避免手机上空转耗电
      draw();
      needsDraw = false;
    }

    window.requestAnimationFrame(frame);
  }

  // 明暗模式切换后重绘静态画面
  if (window.MutationObserver) {
    new MutationObserver(function () {
      needsDraw = true;
    }).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });
  }

  resize();
  window.addEventListener("load", resize);
  window.requestAnimationFrame(frame);
})();
