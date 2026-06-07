export class AssetLoader {
  constructor(scene) {
    this.scene = scene;
    this.assetIndex = scene.cache.json.get('assetIndex');
  }

  load() {
    if (!this.assetIndex) {
      console.error('assetIndex not found in cache — make sure BootScene ran first');
      return;
    }

    const { assets, config } = this.assetIndex;
    const baseUrl = config.baseUrl;

    if (assets.characters) {
      Object.entries(assets.characters).forEach(([key, character]) => {
        this._loadCharacter(key, character, baseUrl);
      });
    }

    if (assets.effects) {
      Object.entries(assets.effects).forEach(([, effects]) => {
        Object.entries(effects).forEach(([key, effect]) => {
          this._loadEffect(key, effect, baseUrl);
        });
      });
    }

    if (assets.tiles) {
      Object.entries(assets.tiles).forEach(([key, tile]) => {
        this.scene.load.image(`tileset_${key}`, `${baseUrl}/${tile.path}`);
      });
    }
  }

  _loadCharacter(key, character, baseUrl) {
    if (!character.animations) return;

    Object.entries(character.animations).forEach(([animKey, anim]) => {
      const spriteKey = `${key}_${animKey}`;
      this.scene.load.spritesheet(spriteKey, `${baseUrl}/${anim.path}`, {
        frameWidth: anim.frameWidth,
        frameHeight: anim.frameHeight,
      });

      if (!this.scene.animConfigs) this.scene.animConfigs = [];
      this.scene.animConfigs.push({
        key: spriteKey,
        spriteKey,
        frameCount: anim.frameCount,
        frameRate: anim.frameRate,
      });
    });
  }

  _loadEffect(key, effect, baseUrl) {
    const spriteKey = `effect_${key}`;
    this.scene.load.spritesheet(spriteKey, `${baseUrl}/${effect.path}`, {
      frameWidth: effect.frameWidth,
      frameHeight: effect.frameHeight,
    });

    if (!this.scene.animConfigs) this.scene.animConfigs = [];
    this.scene.animConfigs.push({
      key: spriteKey,
      spriteKey,
      frameCount: effect.frameCount,
      frameRate: effect.frameRate,
      repeat: 0,
    });
  }

  createAnimations() {
    if (!this.scene.animConfigs) return;
    this.scene.animConfigs.forEach((cfg) => {
      if (!this.scene.anims.exists(cfg.key)) {
        this.scene.anims.create({
          key: cfg.key,
          frames: this.scene.anims.generateFrameNumbers(cfg.spriteKey, {
            start: 0,
            end: cfg.frameCount - 1,
          }),
          frameRate: cfg.frameRate,
          repeat: cfg.repeat !== undefined ? cfg.repeat : -1,
        });
      }
    });
  }

  getTile(key) {
    return this.assetIndex?.assets?.tiles?.[key] ?? null;
  }

  getCharacter(key) {
    return this.assetIndex?.assets?.characters?.[key] ?? null;
  }
}
