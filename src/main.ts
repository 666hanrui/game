import { installGameOpeningFlowFix } from "./core/GameOpeningFlowFix";
import { GameWithSound } from "./core/GameWithSound";
import { HubCampPanel } from "./ui/HubCampPanel";
import { HubSubPanelManager } from "./ui/HubSubPanelManager";
import { getHubSubPanelId, type HubCampAction } from "./data/hubActions";
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
  const hubSubPanels = new HubSubPanelManager();
  const runSupply = new RunSupplyRuntime(game);
  let showHubCamp = true;
  let lastPhase = game.phase;

  function handleHubAction(action: HubCampAction | null): boolean {
    if (!action) return false;

    if (action === "start") {
      hubSubPanels.close();
      showHubCamp = false;
      return true;
    }

    const subPanelId = getHubSubPanelId(action);
    if (subPanelId) {
      hubSubPanels.open(subPanelId);
      return true;
    }

    return false;
  }

  canvas.addEventListener("pointerdown", () => canvas.focus());

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && showHubCamp && game.phase === "menu" && hubSubPanels.isOpen()) {
      hubSubPanels.close();
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true });

  canvas.addEventListener("click", (e) => {
    if (!showHubCamp || game.phase !== "menu") return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (hubSubPanels.isOpen()) {
      hubSubPanels.handleClick(x, y);
      e.stopImmediatePropagation();
      e.preventDefault();
      return;
    }

    const action = hubCamp.handleClick(x, y);
    if (handleHubAction(action)) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);

  let lastTime = performance.now();

  function loop(now: number): void {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = now;

    if (showHubCamp && game.phase === "menu" && !hubSubPanels.isOpen()) {
      handleHubAction(hubCamp.update(game.input, dt, game.w, game.h));
    }

    runSupply.beforeGameUpdate();
    game.update(dt);
    runSupply.afterGameUpdate(dt);

    if (lastPhase === "result" && game.phase === "menu") {
      showHubCamp = true;
      hubSubPanels.close();
    }
    lastPhase = game.phase;

    if (showHubCamp && game.phase === "menu") {
      if (hubSubPanels.isOpen()) hubSubPanels.render(game.ctx, game.w, game.h);
      else hubCamp.render(game.ctx, game.w, game.h);
    } else {
      game.render();
      runSupply.render(game.ctx);
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
