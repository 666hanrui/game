import { GameWithSound } from "./core/GameWithSound";
import { HubCampPanel } from "./ui/HubCampPanel";
import { RunSupplyRuntime } from "./systems/RunSupplyRuntime";
import { Projectile, ProjectileKind } from "./entities/Projectile";

const WORLD_W = 2400;
const WORLD_H = 2400;

function main(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  if (!canvas) {
    console.error("找不到 #game canvas");
    return;
  }

  // 允许 canvas 获得焦点，但战斗保底输入不依赖它。
  canvas.tabIndex = 0;
  canvas.focus();

  const game = new GameWithSound(canvas);
  const hubCamp = new HubCampPanel();
  const runSupply = new RunSupplyRuntime(game);
  let showHubCamp = true;
  let lastPhase = game.phase;
  let battleFireTimer = 0;
  let lastWaveScattered = 0;

  const liveKeys = new Set<string>();
  const rememberKey = (e: KeyboardEvent) => {
    liveKeys.add(e.key.toLowerCase());
    liveKeys.add(e.code.toLowerCase());
    if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " ", "j"].includes(e.key.toLowerCase()) ||
      ["keyw", "keya", "keys", "keyd", "space", "keyj"].includes(e.code.toLowerCase())) {
      e.preventDefault();
    }
  };
  const forgetKey = (e: KeyboardEvent) => {
    liveKeys.delete(e.key.toLowerCase());
    liveKeys.delete(e.code.toLowerCase());
  };
  window.addEventListener("keydown", rememberKey, { capture: true });
  window.addEventListener("keyup", forgetKey, { capture: true });
  window.addEventListener("blur", () => liveKeys.clear());

  const hasAnyKey = (keys: string[]) => keys.some((key) => liveKeys.has(key));

  canvas.addEventListener("click", (e) => {
    canvas.focus();
    if (!showHubCamp || game.phase !== "menu") return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const action = hubCamp.handleClick(x, y);

    if (action === "start") {
      showHubCamp = false;
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    if (action) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  function resetAccidentalFirstWave(): void {
    game.enemies = [];
    game.projectiles = [];
    game.pickups = [];
    game.particles = [];
    game.floatingTexts = [];
    game.waveNum = 0;
    game.kills = 0;
    game.bossKills = 0;
    game.shootTimer = 0;
    lastWaveScattered = 0;
  }

  function reapplyGameStats(): void {
    (game as unknown as { applyAllMods?: () => void }).applyAllMods?.();
    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
  }

  function enforceOpeningFlow(): void {
    if (game.phase === "playing" && game.selectedRace && !game.selectedSchool) {
      resetAccidentalFirstWave();
      reapplyGameStats();
      game.phase = "school_choice";
      return;
    }

    if (game.phase === "upgrade" && game.selectedRace && game.selectedSchool && game.selectedWeapon && game.waveNum === 0) {
      reapplyGameStats();
      game.startNextWave();
      scatterEnemiesNearPlayer(true);
      game.phase = "playing";
    }
  }

  function getDirectMoveDir(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (hasAnyKey(["w", "keyw", "arrowup"])) y -= 1;
    if (hasAnyKey(["s", "keys", "arrowdown"])) y += 1;
    if (hasAnyKey(["a", "keya", "arrowleft"])) x -= 1;
    if (hasAnyKey(["d", "keyd", "arrowright"])) x += 1;
    const len = Math.sqrt(x * x + y * y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
  }

  function projectileKindForWeapon(): ProjectileKind {
    switch (game.selectedWeapon?.id) {
      case "wand": return "magic";
      case "staff": return "heavy_magic";
      case "energy_core": return "energy";
      case "flying_blade": return "blade";
      case "drone_core": return "drone";
      case "orb": return "magic";
      default: return "arrow";
    }
  }

  function projectileSpeedForWeapon(): number {
    switch (game.selectedWeapon?.id) {
      case "staff": return 500;
      case "wand": return 560;
      case "flying_blade": return 540;
      case "energy_core": return 650;
      case "spear": return 760;
      case "orb": return 460;
      default: return 620;
    }
  }

  function findNearestEnemy() {
    let result = null as null | typeof game.enemies[number];
    let best = 999999;
    for (const enemy of game.enemies) {
      if (!enemy.alive) continue;
      const dx = enemy.pos.x - game.player.pos.x;
      const dy = enemy.pos.y - game.player.pos.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < best) {
        best = d;
        result = enemy;
      }
    }
    return result;
  }

  function directBattleFire(dt: number): void {
    if (game.phase !== "playing" || !game.selectedWeapon) return;
    battleFireTimer -= dt;
    if (battleFireTimer > 0) return;

    const target = findNearestEnemy();
    let dx = game.input.state.aimDir.x || 1;
    let dy = game.input.state.aimDir.y || 0;
    if (target) {
      dx = target.pos.x - game.player.pos.x;
      dy = target.pos.y - game.player.pos.y;
    }
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = projectileSpeedForWeapon();
    const kind = projectileKindForWeapon();
    game.projectiles.push(new Projectile(
      game.player.pos.x,
      game.player.pos.y,
      (dx / len) * speed,
      (dy / len) * speed,
      false,
      Math.max(1, game.player.damage),
      kind,
    ));

    battleFireTimer = Math.max(0.16, Math.min(0.5, game.player.attackCooldown || 0.35));
  }

  function directBattleMove(dt: number): void {
    if (game.phase !== "playing") return;
    const move = getDirectMoveDir();
    if (move.x === 0 && move.y === 0) return;

    const speed = game.player.speed || 260;
    game.player.pos.x = Math.max(game.player.radius, Math.min(WORLD_W - game.player.radius, game.player.pos.x + move.x * speed * dt));
    game.player.pos.y = Math.max(game.player.radius, Math.min(WORLD_H - game.player.radius, game.player.pos.y + move.y * speed * dt));

    game.camera.follow(game.player.pos.x, game.player.pos.y);
    game.camera.update();
  }

  function scatterEnemiesNearPlayer(force = false): void {
    if (game.phase !== "playing") return;
    if (!force && game.waveNum === lastWaveScattered) return;
    if (game.enemies.length <= 0) return;

    const px = game.player.pos.x;
    const py = game.player.pos.y;
    game.enemies.forEach((enemy, i) => {
      if (!enemy.alive) return;
      const angle = (i / Math.max(1, game.enemies.length)) * Math.PI * 2 + Math.random() * 0.35;
      const dist = 280 + Math.random() * 190;
      enemy.pos.x = Math.max(80, Math.min(WORLD_W - 80, px + Math.cos(angle) * dist));
      enemy.pos.y = Math.max(80, Math.min(WORLD_H - 80, py + Math.sin(angle) * dist));
    });
    lastWaveScattered = game.waveNum;
  }

  function drawBattleDebugOverlay(): void {
    if (game.phase !== "playing") return;
    const ctx = game.ctx;
    const move = getDirectMoveDir();
    ctx.save();
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(0,0,0,0.46)";
    ctx.fillRect(16, game.h - 66, 460, 48);
    ctx.fillStyle = move.x || move.y ? "#80deea" : "rgba(255,255,255,0.55)";
    ctx.fillText(`输入检测 WASD: ${move.x.toFixed(1)}, ${move.y.toFixed(1)}  自动攻击: ON`, 28, game.h - 42);
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    ctx.fillText(`坐标: ${Math.round(game.player.pos.x)}, ${Math.round(game.player.pos.y)}  敌人: ${game.enemies.length}  弹体: ${game.projectiles.length}`, 28, game.h - 24);
    ctx.restore();
  }

  let lastTime = performance.now();

  function loop(now: number): void {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = now;

    if (showHubCamp && game.phase === "menu") {
      const action = hubCamp.update(game.input, dt, game.w, game.h);
      if (action === "start") showHubCamp = false;
    }

    enforceOpeningFlow();
    runSupply.beforeGameUpdate();
    game.update(dt);
    enforceOpeningFlow();
    scatterEnemiesNearPlayer();
    directBattleMove(dt);
    directBattleFire(dt);
    runSupply.afterGameUpdate(dt);

    if (lastPhase === "result" && game.phase === "menu") showHubCamp = true;
    lastPhase = game.phase;

    if (showHubCamp && game.phase === "menu") {
      hubCamp.render(game.ctx, game.w, game.h);
    } else {
      game.render();
      runSupply.render(game.ctx);
      drawBattleDebugOverlay();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
