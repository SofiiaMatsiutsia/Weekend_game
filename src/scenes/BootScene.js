export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.json('assetIndex', '/assets/index.json');
  }

  create() {
    this.scene.start('GymLevel');
  }
}
