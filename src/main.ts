import { GameWithSound } from "./core/GameWithSound";
import { HubCampPanel } from "./ui/HubCampPanel";
import { RunSupplyRuntime } from "./systems/RunSupplyRuntime";

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

  function clearBadOpeningWave(): void {
    game.enemies = [];
    game.projectiles = [];
    game.pickups = [];
    game.particles = [];
    game.floatingTexts = [];
    game.waveNum = 0;
    game.kills = 0;
    game.bossKills = 0;
    game.shootTimer = 0;
  }

  function enforceOpeningFlow(): void {
    if (game.phase === "playing" && game.selectedRace && !game.selectedSchool) {
      clearBadOpeningWave();
      game.phase = "school_choice";
      return;
    }

    if (game.phase === "upgrade" && game.selectedRace && game.selectedSchool && game.selectedWeapon && game.waveNum === 0) {
      game.startNextWave();
      game.phase = "playing";
    }
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
    runSupply.afterGameUpdate(dt);

    if (lastPhase === "result" && game.phase === "menu") showHubCamp = true;
    lastPhase = game.phase;

    if (showHubCamp && game.phase === "menu") {
      hubCamp.render(game.ctx, game.w, game.h);
    } else {
      game.render();
      runSupply.render(game.ctx);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
