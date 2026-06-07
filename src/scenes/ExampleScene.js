import { AssetLoader } from '../utils/AssetLoader.js';

export class ExampleScene extends Phaser.Scene {
  constructor() {
    super('ExampleScene');
    this.assetLoader = null;
  }

  preload() {
    // Initialize asset loader
    this.assetLoader = new AssetLoader(this);
    // Load all assets from index.json
    this.assetLoader.load();
  }

  create() {
    // Create all animations from loaded assets
    this.assetLoader.createAnimations();

    // Example: Create a player sprite
    const player = this.add.sprite(100, 100, 'boy_walk');
    player.play('boy_walk');

    // Example: Create a tilemap layer
    // You would typically use this with a tilemap:
    // const tileset = this.make.tileset({
    //   key: 'tileset_floor'
    // });

    // Get character config for reference
    const boyConfig = this.assetLoader.getCharacter('boy');
    console.log('Boy character config:', boyConfig);

    // Get tile config
    const floorTileConfig = this.assetLoader.getTile('floor');
    console.log('Floor tile config:', floorTileConfig);
  }

  update() {
    // Game update logic here
  }
}
