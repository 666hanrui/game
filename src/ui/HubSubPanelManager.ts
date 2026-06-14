import { ApothecaryPanel } from "./ApothecaryPanel";
import { ArchivePanel } from "./ArchivePanel";
import { CraftingPanel } from "./CraftingPanel";
import { EconomyStoragePanel } from "./EconomyStoragePanel";
import { LootPanel } from "./LootPanel";
import { MaterialStoragePanel } from "./MaterialStoragePanel";
import { MetaTalentPanel } from "./MetaTalentPanel";
import { QuestBoardPanel } from "./QuestBoardPanel";
import { RegionMapPanel } from "./RegionMapPanel";
import { WorkshopPanel } from "./WorkshopPanel";
import { MetaProgress } from "../systems/MetaProgress";
import { MetaTalentProgress } from "../systems/MetaTalentProgress";
import { QuestProgress } from "../systems/QuestProgress";

export type HubSubPanelId =
  | "crafting"
  | "material_storage"
  | "economy_storage"
  | "talents"
  | "quests"
  | "workshop"
  | "apothecary"
  | "loot"
  | "region_map"
  | "archive";

export interface HubSubPanelHandleResult {
  closed: boolean;
  action: string | null;
}

export const HUB_SUB_PANEL_LABELS: Record<HubSubPanelId, string> = {
  crafting: "合成台",
  material_storage: "材料仓库",
  economy_storage: "资源仓库",
  talents: "天赋祭坛",
  quests: "任务板",
  workshop: "铁匠工坊",
  apothecary: "药剂屋",
  loot: "宝箱陈列台",
  region_map: "收复沙盘",
  archive: "异种档案馆",
};

export class HubSubPanelManager {
  private activePanel: HubSubPanelId | null = null;

  private readonly craftingPanel = new CraftingPanel();
  private readonly materialStoragePanel = new MaterialStoragePanel();
  private readonly economyStoragePanel = new EconomyStoragePanel();
  private readonly metaTalentPanel = new MetaTalentPanel();
  private readonly questBoardPanel = new QuestBoardPanel();
  private readonly workshopPanel = new WorkshopPanel();
  private readonly apothecaryPanel = new ApothecaryPanel();
  private readonly lootPanel = new LootPanel();
  private readonly regionMapPanel = new RegionMapPanel();
  private readonly archivePanel = new ArchivePanel();

  private readonly metaProgress = new MetaProgress();
  private readonly metaTalentProgress = new MetaTalentProgress();
  private readonly questProgress = new QuestProgress();

  open(panel: HubSubPanelId): void {
    this.activePanel = panel;
  }

  close(): void {
    this.activePanel = null;
  }

  getActivePanel(): HubSubPanelId | null {
    return this.activePanel;
  }

  isOpen(): boolean {
    return this.activePanel !== null;
  }

  getActiveLabel(): string {
    return this.activePanel ? HUB_SUB_PANEL_LABELS[this.activePanel] : "营地";
  }

  handleClick(cx: number, cy: number): HubSubPanelHandleResult {
    if (!this.activePanel) return { closed: false, action: null };

    switch (this.activePanel) {
      case "crafting": {
        const action = this.craftingPanel.handleClick(cx, cy, this.metaProgress);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "material_storage": {
        const action = this.materialStoragePanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "economy_storage": {
        const action = this.economyStoragePanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "talents": {
        const action = this.metaTalentPanel.handleClick(cx, cy, this.metaTalentProgress);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "quests": {
        const action = this.questBoardPanel.handleClick(cx, cy, this.questProgress);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "workshop": {
        const action = this.workshopPanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "apothecary": {
        const action = this.apothecaryPanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "loot": {
        const action = this.lootPanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "region_map": {
        const action = this.regionMapPanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
      case "archive": {
        const action = this.archivePanel.handleClick(cx, cy);
        if (action === "back") return this.closeWithResult();
        return { closed: false, action };
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    if (!this.activePanel) return;

    switch (this.activePanel) {
      case "crafting":
        this.craftingPanel.render(ctx, w, h, this.metaProgress);
        return;
      case "material_storage":
        this.materialStoragePanel.render(ctx, w, h, this.metaProgress);
        return;
      case "economy_storage":
        this.economyStoragePanel.render(ctx, w, h);
        return;
      case "talents":
        this.metaTalentPanel.render(ctx, w, h, this.metaTalentProgress);
        return;
      case "quests":
        this.questBoardPanel.render(ctx, w, h, this.questProgress);
        return;
      case "workshop":
        this.workshopPanel.render(ctx, w, h);
        return;
      case "apothecary":
        this.apothecaryPanel.render(ctx, w, h);
        return;
      case "loot":
        this.lootPanel.render(ctx, w, h);
        return;
      case "region_map":
        this.regionMapPanel.render(ctx, w, h);
        return;
      case "archive":
        this.archivePanel.render(ctx, w, h);
        return;
    }
  }

  private closeWithResult(): HubSubPanelHandleResult {
    this.close();
    return { closed: true, action: "back" };
  }
}
