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

  const debugEl = document.createElement("pre");
  debugEl.id = "runtime-debug-panel";
  debugEl.style.position = "fixed";
  debugEl.style.left = "12px";
  debugEl.style.top = "118px";
  debugEl.style.zIndex = "999999";
  debugEl.style.width = "760px";
  debugEl.style.maxWidth = "calc(100vw - 24px)";
  debugEl.style.padding = "10px 12px";
  debugEl.style.margin = "0";
  debugEl.style.background = "rgba(0,0,0,0.84)";
  debugEl.style.border = "2px solid #80deea";
  debugEl.style.color = "#ffffff";
  debugEl.style.font = "12px/1.45 monospace";
  debugEl.style.pointerEvents = "none";
  debugEl.style.whiteSpace = "pre-wrap";
  debugEl.textContent = "debug booting...";
  document.body.appendChild(debugEl);

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

  function updateRuntimeDebug(): void {
    const input = game.input;
    const move = input.state.moveDir;
    const aim = input.state.aimDir;
    const autoFire = typeof input.isAutoFireEnabled === "function" ? input.isAutoFireEnabled() : false;
    const focus = document.activeElement === canvas ? "canvas" : (document.activeElement?.tagName ?? "none");
    debugEl.textContent = [
      `DEBUG phase=${game.phase} hub=${showHubCamp ? "on" : "off"} focus=${focus}`,
      `race=${game.selectedRace?.id ?? "-"} school=${game.selectedSchool?.id ?? "-"} weapon=${game.selectedWeapon?.id ?? "-"}`,
      `move=(${move.x.toFixed(2)},${move.y.toFixed(2)}) aim=(${aim.x.toFixed(2)},${aim.y.toFixed(2)}) fire=${input.state.shooting ? "yes" : "no"} auto=${autoFire ? "on" : "off"}`,
      `player=(${Math.round(game.player.pos.x)},${Math.round(game.player.pos.y)}) speed=${game.player.speed} hp=${Math.round(game.player.hp)}/${game.player.maxHp}`,
      `camera=(${Math.round(game.camera.pos.x)},${Math.round(game.camera.pos.y)}) wave=${game.waveNum} enemies=${game.enemies.length} shots=${game.projectiles.length}`,
      `timer=${game.shootTimer.toFixed(2)} time=${game.gameTime.toFixed(1)} keys: WASD J Space F`,
    ].join("\n");
  }

  let lastTime = performance.now();

  function loop(now: number): void {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = now;

    game.input.update();

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

    updateRuntimeDebug();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
