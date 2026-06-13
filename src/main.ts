import { Game } from "./core/Game";

function main(): void {
  const canvas = document.getElementById("game") as HTMLCanvasElement;
  if (!canvas) {
    console.error("找不到 #game canvas");
    return;
  }

  const game = new Game(canvas);

  let lastTime = performance.now();

  function loop(now: number): void {
    // 计算 delta 时间（秒），上限 0.1 防止大帧跳跃
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    lastTime = now;

    game.update(dt);
    game.render();

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

main();
