import { ASSET_MANIFEST } from "../data/assetManifest";

type AssetManifest = Record<string, Record<string, string>>;

export class AssetLoader {
  private images = new Map<string, HTMLImageElement>();

  constructor(manifest: AssetManifest = ASSET_MANIFEST as AssetManifest) {
    this.preload(manifest);
  }

  private preload(manifest: AssetManifest): void {
    for (const group of Object.keys(manifest)) {
      for (const id of Object.keys(manifest[group])) {
        const path = manifest[group][id];
        const img = new Image();
        img.src = path;
        this.images.set(this.key(group, id), img);
      }
    }
  }

  get(group: string, id: string | null | undefined): HTMLImageElement | null {
    if (!id) return null;
    const img = this.images.get(this.key(group, id));
    if (!img) return null;
    if (!img.complete || img.naturalWidth <= 0) return null;
    return img;
  }

  private key(group: string, id: string): string {
    return `${group}.${id}`;
  }
}
