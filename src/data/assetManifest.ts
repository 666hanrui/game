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

  raceWalkSheets: {
    human: "/assets/sprites/races/human_walk.png",
    goblin: "/assets/sprites/races/goblin_walk.png",
    elf: "/assets/sprites/races/elf_walk.png",
    orc: "/assets/sprites/races/orc_walk.png",
    spirit: "/assets/sprites/races/spirit_walk.png",
  },

  weapons: {
    bow: "/assets/sprites/gear/bow.svg",
    flying_blade: "/assets/sprites/gear/flying_blade.svg",
    spear: "/assets/sprites/gear/martial_line.svg",
    mace: "/assets/sprites/gear/mace.svg",
    wand: "/assets/sprites/gear/wand.svg",
    staff: "/assets/sprites/gear/staff.svg",
    orb: "/assets/sprites/gear/orb.svg",
    drone_core: "/assets/sprites/gear/drone_core.svg",
    energy_core: "/assets/sprites/gear/tech_reactor.svg",
  },

  enemies: {
    slime: "/assets/sprites/enemies/slime.png",
    spider: "/assets/sprites/enemies/spider.png",
    skeleton: "/assets/sprites/enemies/skeleton.png",
    // Monster role styles
    style_basic: "/assets/sprites/enemies/style_basic.png",
    style_fast: "/assets/sprites/enemies/style_fast.png",
    style_tank: "/assets/sprites/enemies/style_tank.png",
    style_ranged: "/assets/sprites/enemies/style_ranged.png",
    style_bomber: "/assets/sprites/enemies/style_bomber.png",
    style_summoner: "/assets/sprites/enemies/style_summoner.png",
    style_healer: "/assets/sprites/enemies/style_healer.png",
    style_elite: "/assets/sprites/enemies/style_elite.png",
    style_boss: "/assets/sprites/enemies/style_boss.png",
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
    hammer: "/assets/sprites/gear/mace.svg",
  },

  hub: {
    npc_leader: "/assets/sprites/hub/npc_leader.png",
    npc_instructor: "/assets/sprites/hub/npc_instructor.png",
    npc_treasurer: "/assets/sprites/hub/npc_treasurer.png",
    npc_blacksmith: "/assets/sprites/hub/npc_blacksmith.png",
    npc_apothecary: "/assets/sprites/hub/npc_apothecary.png",
    npc_secretary: "/assets/sprites/hub/npc_secretary.png",
    npc_crafter: "/assets/sprites/hub/npc_crafter.png",
    npc_keeper: "/assets/sprites/hub/npc_keeper.png",
    npc_archivist: "/assets/sprites/hub/npc_archivist.png",
    npc_cartographer: "/assets/sprites/hub/npc_cartographer.png",
    npc_historian: "/assets/sprites/hub/npc_historian.png",
    // Camp building sprites
    building_gate: "/assets/sprites/hub/building_gate.png",
    building_temple: "/assets/sprites/hub/building_temple.png",
    building_economyStorage: "/assets/sprites/hub/building_economyStorage.png",
    building_workshop: "/assets/sprites/hub/building_workshop.png",
    building_apothecary: "/assets/sprites/hub/building_apothecary.png",
    building_quests: "/assets/sprites/hub/building_quests.png",
    building_crafting: "/assets/sprites/hub/building_crafting.png",
    building_storage: "/assets/sprites/hub/building_storage.png",
    building_loot: "/assets/sprites/hub/building_loot.png",
    building_map: "/assets/sprites/hub/building_map.png",
    building_archive: "/assets/sprites/hub/building_archive.png",
  }
} as const;

export type AssetGroup = keyof typeof ASSET_MANIFEST;
