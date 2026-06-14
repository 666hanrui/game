import { Game } from "./Game";
import { Enemy, EnemyRole } from "../entities/Enemy";
import type { Race } from "../data/races";
import type { Weapon } from "../data/weapons";

const WORLD_W = 2400;
const WORLD_H = 2400;

interface MutableGame extends Game {
  selectRace: (race: Race) => void;
  selectWeapon: (weapon: Weapon) => void;
  applyAllMods: () => void;
  addText: (x: number, y: number, text: string, color: string, life?: number) => void;
  bannerText: string;
  bannerTimer: number;
}

function clearRunState(game: Game): void {
  game.enemies = [];
  game.projectiles = [];
  game.pickups = [];
  game.particles = [];
  game.floatingTexts = [];
  game.kills = 0;
  game.waveNum = 0;
  game.bossKills = 0;
  game.shootTimer = 0;
  game.gameTime = 0;
}

function placeEnemyNearPlayer(game: Game, enemy: Enemy, index: number, total: number): void {
  const baseAngle = (index / Math.max(1, total)) * Math.PI * 2;
  const angle = baseAngle + (Math.random() - 0.5) * 0.52;
  const dist = 260 + Math.random() * 180;
  enemy.pos.x = Math.max(80, Math.min(WORLD_W - 80, game.player.pos.x + Math.cos(angle) * dist));
  enemy.pos.y = Math.max(80, Math.min(WORLD_H - 80, game.player.pos.y + Math.sin(angle) * dist));
}

export function installGameOpeningFlowFix(): void {
  const proto = Game.prototype as unknown as MutableGame;

  proto.selectRace = function selectRace(race: Race): void {
    this.selectedRace = race;
    this.selectedSchool = null;
    this.selectedWeapon = null;
    this.appliedSkills = [];
    this.appliedSkillIds = [];
    clearRunState(this);
    this.xp.reset();
    this.applyAllMods();
    this.player.hp = this.player.maxHp;
    this.camera.snap(this.player.pos.x, this.player.pos.y);
    this.phase = "school_choice";
  };

  proto.selectWeapon = function selectWeapon(weapon: Weapon): void {
    this.selectedWeapon = weapon;
    this.applyAllMods();
    this.player.hp = Math.min(this.player.hp, this.player.maxHp);
    this.bannerText = `${weapon.name} 已就绪`;
    this.bannerTimer = 1.2;
    if (this.waveNum === 0 && this.enemies.length === 0) this.startNextWave();
    this.phase = "playing";
  };

  Game.prototype.startNextWave = function startNextWave(this: Game): void {
    this.waveNum++;
    const hpMult = this.wave.getHPMultiplier(this.waveNum);
    const spdMult = this.wave.getSpeedMultiplier(this.waveNum);
    const roles = this.wave.getRolesForWave(this.waveNum) as EnemyRole[];
    const nearPlayer = this.waveNum <= 2;

    roles.forEach((role, index) => {
      const enemy = new Enemy(WORLD_W, WORLD_H, hpMult, spdMult, role);
      if (nearPlayer) placeEnemyNearPlayer(this, enemy, index, roles.length);
      this.enemies.push(enemy);
    });

    const mutable = this as unknown as MutableGame;
    if (this.wave.isBossWave(this.waveNum)) {
      mutable.bannerText = `Boss 来袭 · 第 ${this.waveNum} 波`;
      mutable.bannerTimer = 2.2;
    } else {
      mutable.addText(this.player.pos.x, this.player.pos.y - 52, `第 ${this.waveNum} 波`, "#90caf9", 1.1);
    }
  };
}
