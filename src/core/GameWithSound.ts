import { Game } from "./Game";
import { SoundSystem } from "../systems/SoundSystem";

interface GameSoundSnapshot {
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  kills: number;
  bossKills: number;
  playerShots: number;
  bossCount: number;
  phase: string;
}

export class GameWithSound extends Game {
  private sound = new SoundSystem();
  private muted = false;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas);

    const unlock = () => this.sound.unlock();
    canvas.addEventListener("pointerdown", unlock);
    canvas.addEventListener("touchstart", unlock, { passive: true });
    window.addEventListener("keydown", (e) => {
      this.sound.unlock();
      if (e.key.toLowerCase() === "m") {
        this.muted = !this.muted;
        this.sound.setEnabled(!this.muted);
      }
    });
  }

  update(dt: number): void {
    const before = this.snapshot();
    super.update(dt);
    const after = this.snapshot();
    this.updateSounds(before, after);
  }

  private snapshot(): GameSoundSnapshot {
    return {
      hp: this.player.hp,
      maxHp: this.player.maxHp,
      level: this.xp.level,
      xp: this.xp.xp,
      kills: this.kills,
      bossKills: this.bossKills,
      playerShots: this.projectiles.filter((p) => !p.fromEnemy).length,
      bossCount: this.enemies.filter((e) => e.role === "boss").length,
      phase: this.phase,
    };
  }

  private updateSounds(before: GameSoundSnapshot, after: GameSoundSnapshot): void {
    if (this.muted) return;

    const enteredGameplay = before.phase !== after.phase && after.phase === "playing";
    const inOrEnteringGameplay = after.phase === "playing" || enteredGameplay;

    if (after.bossCount > before.bossCount) {
      this.sound.bossSpawn();
    }

    if (after.bossKills > before.bossKills) {
      this.sound.bossDefeated();
      return;
    }

    if (after.level > before.level) {
      this.sound.levelUp();
    }

    if (after.hp < before.hp) {
      this.sound.playerHurt();
    }

    if (after.hp > before.hp && after.hp <= after.maxHp && after.level === before.level) {
      this.sound.pickupHP();
    }

    if (after.kills > before.kills) {
      this.sound.kill();
    }

    if (after.xp > before.xp && after.kills === before.kills && after.level === before.level) {
      this.sound.pickupXP();
    }

    if (inOrEnteringGameplay && after.playerShots > before.playerShots) {
      this.sound.attack();
    }
  }
}
