export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.json('assetIndex', '/assets/index.json');
    this.load.audio('sfx_shot',       '/audio/sound/shot.mp3');
    this.load.audio('sfx_ninja_death','/audio/sound/ninja_death.mp3');
    this.load.audio('sfx_new_level',  '/audio/sound/new_level.mp3');
    this.load.audio('sfx_game_start', '/audio/sound/game_start.mp3');
    this.load.audio('sfx_game_over',  '/audio/sound/game_over.mp3');
    this.load.audio('sfx_boy_hurt',   '/audio/sound/boy_hurt.mp3');
  }

  create() {
    this.scene.start('GymLevel');
  }
}
