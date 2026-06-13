import { GameWithSound } from "./core/GameWithSound";
import { HubCampPanel } from "./ui/HubCampPanel";
import { RunSupplyRuntime } from "./systems/RunSupplyRuntime";

function main(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  if (!canvas) {
    console.error("找不到 #game canvas");
    return;
  }

  const game = new GameWithSound(canvas);
  const hubCamp = new HubCampPanel();
  const runSupply = new RunSupplyRuntime(game);
  let showHubCamp = true;
  let lastPhase = game.phase;

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
  }

  function reapplyGameStats(): void {
    // applyAllMods 是 Game 内部方法；这里作为临时开局流程守卫调用。
    // 后续应该把 Game.ts 的 selectRace / selectWeapon 流程正式重构掉。
    (game as unknown as { applyAllMods?: () => void }).applyAllMods?.();
    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
  }

  function enforceOpeningFlow(): void {
    // Game.ts 旧流程里选完种族会直接开始战斗。
    // 但当前设计必须是：种族 -> 体系 -> 武器 -> 正式开局。
    if (game.phase === "playing" && game.selectedRace && !game.selectedSchool) {
      resetAccidentalFirstWave();
      reapplyGameStats();
      game.phase = "school_choice";
      return;
    }

    // 选完武器后，Game.ts 旧流程会先进入 upgrade。
    // 开局第一把不应该先弹升级牌，应该先正式进入第 1 波。
    if (game.phase === "upgrade" && game.selectedRace && game.selectedSchool && game.selectedWeapon && game.waveNum === 0) {
      reapplyGameStats();
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
