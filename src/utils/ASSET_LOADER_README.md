# AssetLoader Utility

Automatically loads and registers all game assets from `index.json` in Phaser 3.

## Quick Start

### 1. In your scene's `preload()` method:
```javascript
import { AssetLoader } from './utils/AssetLoader.js';

preload() {
  this.assetLoader = new AssetLoader(this);
  this.assetLoader.load(); // Loads index.json and registers all assets
}
```

### 2. In your scene's `create()` method:
```javascript
create() {
  // Create all animations
  this.assetLoader.createAnimations();
  
  // Now you can use any asset
  const player = this.add.sprite(100, 100, 'boy_walk');
  player.play('boy_walk');
}
```

## Asset Naming Convention

The utility automatically names all assets with a consistent pattern:

### Characters
- Sprite key: `{characterKey}_{animationKey}`
  - Example: `boy_walk`, `ninjaBlue_attack`, `ninjaRed_idle`
- Faceset: `{characterKey}_face`
  - Example: `boy_face`, `ninjaBlue_face`

### Effects
- Sprite key: `effect_{effectKey}`
  - Example: `effect_circularSlash`

### Tiles
- Image key: `tileset_{tileKey}`
  - Example: `tileset_floor`, `tileset_nature`, `tileset_towers`

## Available Characters
- `boy`
- `ninjaBlue`
- `ninjaRed`
- `ninjaYellow`

### Available Animations (per character)
- `idle`
- `walk`
- `attack`
- `dead`
- `item`

### Available Tiles
- `floor`
- `nature`
- `towers`

### Available Effects
- `circularSlash`

## Usage Examples

### Playing a character animation
```javascript
const player = this.add.sprite(100, 100, 'boy_walk');
player.play('boy_walk');
```

### Changing animation
```javascript
player.stop();
player.setTexture('boy_attack');
player.play('boy_attack');
```

### Getting asset configuration
```javascript
// Get character config
const boyConfig = this.assetLoader.getCharacter('boy');
console.log(boyConfig.animations.walk.frameRate); // 10

// Get tile config
const floorConfig = this.assetLoader.getTile('floor');
console.log(floorConfig.tileWidth); // 16

// Get general config
const config = this.assetLoader.getConfig();
console.log(config.defaultCharacterSize); // 64
```

### Using with Tilemaps
```javascript
create() {
  this.assetLoader.createAnimations();
  
  // Get tileset for tilemap
  const floorConfig = this.assetLoader.getTile('floor');
  
  // Add tileset to tilemap (example)
  const tileset = map.addTilesetImage('floor', 'tileset_floor');
}
```

## API Reference

### `new AssetLoader(scene)`
Create a new asset loader for a scene.

### `async load()`
Load `index.json` and register all assets. Returns the asset index object.

### `registerAssets()`
Register all assets from the index. Called automatically by `load()`.

### `createAnimations()`
Create all animations. Call this in the scene's `create()` method.

### `getAsset(category, key)`
Get asset configuration by category and key.
- `category`: 'characters', 'effects', or 'tiles'
- `key`: The asset key

### `getCharacter(key)`
Get character asset configuration.

### `getTile(key)`
Get tile asset configuration.

### `getConfig()`
Get the general asset config.

## Notes

- Animations are created with `repeat: -1` for characters (loops) and `repeat: 0` for effects (plays once)
- All assets are loaded from `/assets/` relative to the public directory
- Frame numbers are automatically generated based on `frameCount` in index.json
