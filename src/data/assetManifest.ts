// 游戏美术资源映射表
// 资源放在 public/assets/sprites 下，Vite 构建后可通过 /assets/sprites/... 直接访问。

export const ASSET_MANIFEST = {
  races: {
    human: "/assets/sprites/races/human.svg",
    goblin: "/assets/sprites/races/goblin.svg",
    elf: "/assets/sprites/races/elf.svg",
    orc: "/assets/sprites/races/orc.svg",
    spirit: "/assets/sprites/races/spirit.svg",
  },

  weapons: {
    bow: "/assets/sprites/gear/bow.svg",
    flying_blade: "/assets/sprites/gear/flying_blade.svg",
    spear: "/assets/sprites/gear/martial_line.svg",
    wand: "/assets/sprites/gear/wand.svg",
    staff: "/assets/sprites/gear/staff.svg",
    orb: "/assets/sprites/gear/orb.svg",
    drone_core: "/assets/sprites/gear/drone_core.svg",
    energy_core: "/assets/sprites/gear/tech_reactor.svg",
  },

  enemies: {
    slime: "/assets/sprites/enemies/slime.svg",
    spider: "/assets/sprites/enemies/spider.svg",
    skeleton: "/assets/sprites/enemies/skeleton.svg",
  },

  pickups: {
    xp: "/assets/sprites/pickups/xp_gem.svg",
    health: "/assets/sprites/pickups/health_gem.svg",
  },

  projectiles: {
    arrow: "/assets/sprites/projectiles/basic_shot.svg",
    magic: "/assets/sprites/gear/orb.svg",
    heavy_magic: "/assets/sprites/gear/staff.svg",
    energy: "/assets/sprites/gear/tech_reactor.svg",
    blade: "/assets/sprites/gear/flying_blade.svg",
    drone: "/assets/sprites/gear/drone_core.svg",
  },
} as const;

export type AssetGroup = keyof typeof ASSET_MANIFEST;
