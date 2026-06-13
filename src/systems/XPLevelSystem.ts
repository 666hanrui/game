// 经验与等级系统
export class XPLevelSystem {
  xp = 0;
  xpToNext = 100;
  xpPerKill = 20;
  level = 1;

  // 等级提升时的额外经验需求增长
  private baseXP = 100;
  private growthFactor = 1.25;

  addXP(amount: number): void {
    this.xp += amount;
  }

  // 检查是否升级，如果升级则自动扣经验并返回 true
  checkLevelUp(): boolean {
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(this.baseXP * Math.pow(this.growthFactor, this.level - 1));
      return true;
    }
    return false;
  }

  reset(): void {
    this.xp = 0;
    this.xpToNext = this.baseXP;
    this.level = 1;
  }
}
