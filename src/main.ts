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

  let lastTime = performance.now();

  function loop(now: number): void {
    // 计算 delta 时间（秒），上限 0.1 防止大帧跳跃
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = now;

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

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
