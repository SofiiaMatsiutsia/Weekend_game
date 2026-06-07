import { AssetLoader } from '../utils/AssetLoader.js';

export class GymLevel extends Phaser.Scene {
  constructor() {
    super('GymLevel');
    this.player = null;
    this.keys = null;
    this.debugText = null;
    this.debugEnabled = true;
    this.facing = 'down';
  }

  preload() {
    const loader = new AssetLoader(this);
    loader.load();
    this._loader = loader;
  }

  create() {
    this._loader.createAnimations();
    this._createDirectionalAnims();

    this.createWorld();
    this.createPlayer();
    this.createKeys();
    this.createDebugUI();

    this.cameras.main.setBounds(0, 0, 320, 240);
    this.cameras.main.startFollow(this.player);
  }

  _createDirectionalAnims() {
    const sheet = 'boy_walk';
    const idleSheet = 'boy_idle';
    const fps = 10;

    const walkDirs = { down: [0,4,8,12], up: [1,5,9,13], left: [2,6,10,14], right: [3,7,11,15] };
    const idleDirs = { down: [0], up: [1], left: [2], right: [3] };

    Object.entries(walkDirs).forEach(([dir, frames]) => {
      const key = `boy_walk_${dir}`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map(f => ({ key: sheet, frame: f })),
          frameRate: fps,
          repeat: -1,
        });
      }
    });

    Object.entries(idleDirs).forEach(([dir, frames]) => {
      const key = `boy_idle_${dir}`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: frames.map(f => ({ key: idleSheet, frame: f })),
          frameRate: 1,
          repeat: -1,
        });
      }
    });
  }

  createWorld() {
    this.add.rectangle(160, 120, 320, 240, 0x3b2a1a);

    const wallColor = 0x5a4030;
    this.add.rectangle(160, 8,   320, 16, wallColor);
    this.add.rectangle(160, 232, 320, 16, wallColor);
    this.add.rectangle(8,   120, 16, 240, wallColor);
    this.add.rectangle(312, 120, 16, 240, wallColor);

    // Weight rack (left)
    this.add.rectangle(56, 80, 48, 32, 0x888888);
    this.add.rectangle(40, 80, 8, 32, 0x555555);
    this.add.rectangle(72, 80, 8, 32, 0x555555);

    // Bench press (centre)
    this.add.rectangle(160, 168, 64, 12, 0x6b3a2a);
    this.add.rectangle(160, 156, 8, 12, 0x888888);

    // Treadmills (right)
    this.add.rectangle(264, 80, 40, 28, 0x333355);
    this.add.rectangle(264, 100, 40, 4, 0x222244);

    // Floor grid
    const g = this.add.graphics();
    g.lineStyle(1, 0x4a3520, 0.6);
    for (let x = 16; x < 320; x += 32) g.lineBetween(x, 16, x, 224);
    for (let y = 16; y < 240; y += 32) g.lineBetween(16, y, 304, y);

    this.physics.world.setBounds(16, 16, 288, 208);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(160, 120, 'boy_idle');
    this.player.setScale(3);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(12, 12);
    this.player.play('boy_idle_down');
  }

  createKeys() {
    this.keys = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.W,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      debug: Phaser.Input.Keyboard.KeyCodes.BACKTICK,
    });
    this.keys.debug.on('down', () => {
      this.debugEnabled = !this.debugEnabled;
      if (!this.debugEnabled) this.debugText.setText('');
    });
  }

  createDebugUI() {
    this.debugText = this.add.text(4, 4, '', {
      fontSize: '9px',
      fontFamily: 'monospace',
      fill: '#00ff00',
      backgroundColor: '#000000cc',
      padding: { x: 4, y: 4 },
    });
    this.debugText.setScrollFactor(0).setDepth(1000);
  }

  update() {
    const { up, down, left, right } = this.keys;
    const speed = 80;
    let vx = 0, vy = 0;

    if (left.isDown)  vx = -speed;
    if (right.isDown) vx =  speed;
    if (up.isDown)    vy = -speed;
    if (down.isDown)  vy =  speed;

    if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

    this.player.body.setVelocity(vx, vy);

    // Determine facing direction (last pressed wins)
    if (left.isDown)       this.facing = 'left';
    else if (right.isDown) this.facing = 'right';
    else if (up.isDown)    this.facing = 'up';
    else if (down.isDown)  this.facing = 'down';

    const moving = vx !== 0 || vy !== 0;
    const wantedAnim = moving ? `boy_walk_${this.facing}` : `boy_idle_${this.facing}`;

    if (this.player.anims.currentAnim?.key !== wantedAnim) {
      this.player.play(wantedAnim);
    }

    if (this.debugEnabled) {
      this.debugText.setText([
        '[ DEBUG ]  ` to toggle',
        '─────────────────────',
        `pos    ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`,
        `vel    ${Math.round(vx)}, ${Math.round(vy)}`,
        `facing ${this.facing}`,
        `state  ${moving ? 'WALKING' : 'IDLE'}`,
        '─────────────────────',
        'WASD to move',
      ].join('\n'));
    }
  }
}
