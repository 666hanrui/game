export type RuntimeSupplyId =
  | "magnet"
  | "shield"
  | "haste_potion"
  | "power_potion"
  | "health_pack"
  | "regen_dew"
  | "crit_potion"
  | "frost_bomb"
  | "thunder_stone"
  | "quake_stone"
  | "decoy_doll"
  | "turret_pack";

export type ConstructId = "decoy_doll" | "turret_pack";

export interface RuntimeSupplyDrop {
  id: RuntimeSupplyId;
  x: number;
  y: number;
  age: number;
  life: number;
  seed: number;
}

export interface RuntimeEffect {
  id: RuntimeSupplyId;
  label: string;
  color: string;
  duration: number;
  remaining: number;
}

export interface RuntimeConstruct {
  id: ConstructId;
  x: number;
  y: number;
  age: number;
  life: number;
  fireTimer: number;
  seed: number;
}

export interface FloatingSupplyText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}
