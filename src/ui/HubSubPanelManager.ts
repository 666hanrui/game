import { CraftingPanel } from "./CraftingPanel";
import { EconomyStoragePanel } from "./EconomyStoragePanel";
import { MaterialStoragePanel } from "./MaterialStoragePanel";
import { MetaTalentPanel } from "./MetaTalentPanel";
import { QuestBoardPanel } from "./QuestBoardPanel";
import { MetaProgress } from "../systems/MetaProgress";
import { MetaTalentProgress } from "../systems/MetaTalentProgress";
import { QuestProgress } from "../systems/QuestProgress";

export type HubSubPanelId = "crafting" | "material_storage" | "economy_storage" | "talents" | "quests";

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
};

export class HubSubPanelManager {
  private activePanel: HubSubPanelId | null = null;

  private readonly craftingPanel = new CraftingPanel();
  private readonly materialStoragePanel = new MaterialStoragePanel();
  private readonly economyStoragePanel = new EconomyStoragePanel();
  private readonly metaTalentPanel = new MetaTalentPanel();
  private readonly questBoardPanel = new QuestBoardPanel();

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
    }
  }

  private closeWithResult(): HubSubPanelHandleResult {
    this.close();
    return { closed: true, action: "back" };
  }
}
