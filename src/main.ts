import { installGameOpeningFlowFix } from "./core/GameOpeningFlowFix";
import { GameWithSound } from "./core/GameWithSound";
import { HubCampPanel } from "./ui/HubCampPanel";
import { RunSupplyRuntime } from "./systems/RunSupplyRuntime";

installGameOpeningFlowFix();

function main(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  if (!canvas) {
    console.error("找不到 #game canvas");
    return;
  }

  canvas.tabIndex = 0;

  const game = new GameWithSound(canvas);
  const hubCamp = new HubCampPanel();
  const runSupply = new RunSupplyRuntime(game);
  let showHubCamp = true;
  let lastPhase = game.phase;

  canvas.addEventListener("pointerdown", () => canvas.focus());

  canvas.addEventListener("click", (e) => {
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

  function renderRuntimeDebug(): void {
    const ctx = game.ctx;
    const input = game.input;
    const move = input.state.moveDir;
    const aim = input.state.aimDir;
    const autoFire = typeof input.isAutoFireEnabled === "function" ? input.isAutoFireEnabled() : false;
    const focus = document.activeElement === canvas ? "canvas" : (document.activeElement?.tagName ?? "none");
    const lines = [
      `DEBUG  phase=${game.phase}  hub=${showHubCamp ? "on" : "off"}  focus=${focus}`,
      `race=${game.selectedRace?.id ?? "-"}  school=${game.selectedSchool?.id ?? "-"}  weapon=${game.selectedWeapon?.id ?? "-"}`,
      `move=(${move.x.toFixed(2)}, ${move.y.toFixed(2)})  aim=(${aim.x.toFixed(2)}, ${aim.y.toFixed(2)})  shooting=${input.state.shooting ? "yes" : "no"}  auto=${autoFire ? "on" : "off"}`,
      `player=(${Math.round(game.player.pos.x)}, ${Math.round(game.player.pos.y)})  hp=${Math.round(game.player.hp)}/${game.player.maxHp}  speed=${game.player.speed}`,
      `camera=(${Math.round(game.camera.pos.x)}, ${Math.round(game.camera.pos.y)})  wave=${game.waveNum}  enemies=${game.enemies.length}  projectiles=${game.projectiles.length}  pickups=${game.pickups.length}`,
      `shootTimer=${game.shootTimer.toFixed(2)}  time=${game.gameTime.toFixed(1)}  hint: WASD move · mouse/J/space fire · F auto-fire`,
    ];

    const x = 14;
    const y = Math.max(92, game.h - 154);
    const w = Math.min(760, game.w - 28);
    const h = 138;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.strokeStyle = "rgba(128, 222, 234, 0.72)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "12px monospace";
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? "#80deea" : "rgba(255,255,255,0.82)";
      ctx.fillText(lines[i], x + 12, y + 22 + i * 20);
    }
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

    runSupply.beforeGameUpdate();
    game.update(dt);
    runSupply.afterGameUpdate(dt);

    if (lastPhase === "result" && game.phase === "menu") showHubCamp = true;
    lastPhase = game.phase;

    if (showHubCamp && game.phase === "menu") {
      hubCamp.render(game.ctx, game.w, game.h);
    } else {
      game.render();
      runSupply.render(game.ctx);
    }

    renderRuntimeDebug();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
