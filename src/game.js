import { BootScene } from './scenes/BootScene.js';
import { GymLevel } from './scenes/GymLevel.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 320,
  height: 240,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, GymLevel],
  render: {
    pixelArt: true,
    antialias: false,
  },
};

new Phaser.Game(config);
