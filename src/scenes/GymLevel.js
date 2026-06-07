import { AssetLoader } from '../utils/AssetLoader.js';

const BULLET_SPEED  = 220;
const BULLET_LIFE   = 600;   // ms before bullet disappears
const ATTACK_LOCK   = 350;   // ms player is locked in attack pose
const ATTACK_COLOR  = 0xffee44;
const BULLET_RADIUS = 3;

export class GymLevel extends Phaser.Scene {
  constructor() {
    super('GymLevel');
    this.player    = null;
    this.keys      = null;
    this.debugText = null;
    this.debugEnabled = true;
    this.facing    = 'down';
    this.attacking = false;
    this.bullets   = null;
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
    this.createBullets();
    this.createPlayer();
    this.createKeys();
    this.createDebugUI();

    this.cameras.main.setBounds(0, 0, 320, 240);
    this.cameras.main.startFollow(this.player);
  }

  // ─── Animations ───────────────────────────────────────────────────────────

  _createDirectionalAnims() {
    const dirs = { down: 0, up: 1, left: 2, right: 3 };

    Object.entries(dirs).forEach(([dir, col]) => {
      // walk — 4 frames read down a column in a 4×4 grid
      this._anim(`boy_walk_${dir}`,   'boy_walk',   [0,4,8,12].map(r => r + col), 10, -1);
      // idle — single frame per direction
      this._anim(`boy_idle_${dir}`,   'boy_idle',   [col], 1, -1);
      // attack — single frame per direction, held via timer not repeat
      this._anim(`boy_attack_${dir}`, 'boy_attack', [col], 12, 0);
    });
  }

  _anim(key, texture, frames, frameRate, repeat) {
    if (!this.anims.exists(key)) {
      this.anims.create({
        key,
        frames: frames.map(f => ({ key: texture, frame: f })),
        frameRate,
        repeat,
      });
    }
  }

  // ─── World ────────────────────────────────────────────────────────────────

  createWorld() {
    this.add.rectangle(160, 120, 320, 240, 0x3b2a1a);

    const wallColor = 0x5a4030;
    this.add.rectangle(160, 8,   320, 16, wallColor);
    this.add.rectangle(160, 232, 320, 16, wallColor);
    this.add.rectangle(8,   120, 16, 240, wallColor);
    this.add.rectangle(312, 120, 16, 240, wallColor);

    // Weight rack
    this.add.rectangle(56, 80, 48, 32, 0x888888);
    this.add.rectangle(40, 80,  8, 32, 0x555555);
    this.add.rectangle(72, 80,  8, 32, 0x555555);

    // Bench press
    this.add.rectangle(160, 168, 64, 12, 0x6b3a2a);
    this.add.rectangle(160, 156,  8, 12, 0x888888);

    // Treadmills
    this.add.rectangle(264,  80, 40, 28, 0x333355);
    this.add.rectangle(264, 100, 40,  4, 0x222244);

    // Floor grid
    const g = this.add.graphics();
    g.lineStyle(1, 0x4a3520, 0.6);
    for (let x = 16; x < 320; x += 32) g.lineBetween(x, 16, x, 224);
    for (let y = 16; y < 240; y += 32) g.lineBetween(16, y, 304, y);

    this.physics.world.setBounds(16, 16, 288, 208);
  }

  // ─── Bullets ──────────────────────────────────────────────────────────────

  createBullets() {
    // Pre-draw bullet texture once
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(ATTACK_COLOR);
    gfx.fillCircle(BULLET_RADIUS, BULLET_RADIUS, BULLET_RADIUS);
    gfx.generateTexture('bullet', BULLET_RADIUS * 2, BULLET_RADIUS * 2);
    gfx.destroy();

    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 20,
    });
  }

  fireBullet() {
    const b = this.bullets.get(this.player.x, this.player.y);
    if (!b) return;

    b.setActive(true).setVisible(true).setDepth(10);
    b.body.reset(this.player.x, this.player.y);
    b.body.setAllowGravity(false);

    const velMap = {
      right: [ BULLET_SPEED, 0 ],
      left:  [-BULLET_SPEED, 0 ],
      down:  [ 0,  BULLET_SPEED ],
      up:    [ 0, -BULLET_SPEED ],
    };
    const [vx, vy] = velMap[this.facing];
    b.body.setVelocity(vx, vy);

    // Auto-kill after BULLET_LIFE ms
    this.time.delayedCall(BULLET_LIFE, () => {
      if (b.active) b.setActive(false).setVisible(false);
    });
  }

  // ─── Player ───────────────────────────────────────────────────────────────

  createPlayer() {
    this.player = this.physics.add.sprite(160, 120, 'boy_idle');
    this.player.setScale(3).setDepth(5);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(12, 12);
    this.player.play('boy_idle_down');
  }

  // ─── Input ────────────────────────────────────────────────────────────────

  createKeys() {
    this.keys = this.input.keyboard.addKeys({
      up:     Phaser.Input.Keyboard.KeyCodes.W,
      down:   Phaser.Input.Keyboard.KeyCodes.S,
      left:   Phaser.Input.Keyboard.KeyCodes.A,
      right:  Phaser.Input.Keyboard.KeyCodes.D,
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      debug:  Phaser.Input.Keyboard.KeyCodes.BACKTICK,
    });

    this.keys.attack.on('down', () => this.startAttack());
    this.keys.debug.on('down',  () => {
      this.debugEnabled = !this.debugEnabled;
      if (!this.debugEnabled) this.debugText.setText('');
    });
  }

  startAttack() {
    if (this.attacking) return;
    this.attacking = true;

    this.player.play(`boy_attack_${this.facing}`);
    this.fireBullet();

    this.time.delayedCall(ATTACK_LOCK, () => {
      this.attacking = false;
    });
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  update() {
    const { up, down, left, right } = this.keys;
    let vx = 0, vy = 0;

    if (!this.attacking) {
      const speed = 80;
      if (left.isDown)  vx = -speed;
      if (right.isDown) vx =  speed;
      if (up.isDown)    vy = -speed;
      if (down.isDown)  vy =  speed;
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

      // Update facing only when moving
      if (left.isDown)       this.facing = 'left';
      else if (right.isDown) this.facing = 'right';
      else if (up.isDown)    this.facing = 'up';
      else if (down.isDown)  this.facing = 'down';
    }

    this.player.body.setVelocity(vx, vy);

    if (!this.attacking) {
      const moving   = vx !== 0 || vy !== 0;
      const wantAnim = moving ? `boy_walk_${this.facing}` : `boy_idle_${this.facing}`;
      if (this.player.anims.currentAnim?.key !== wantAnim) {
        this.player.play(wantAnim);
      }
    }

    if (this.debugEnabled) this._drawDebug(vx, vy);
  }

  // ─── Debug ────────────────────────────────────────────────────────────────

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

  _drawDebug(vx, vy) {
    const p     = this.player;
    const state = this.attacking ? 'ATTACKING' : (vx || vy ? 'WALKING' : 'IDLE');
    this.debugText.setText([
      '[ DEBUG ]  ` to toggle',
      '─────────────────────',
      `pos    ${Math.round(p.x)}, ${Math.round(p.y)}`,
      `vel    ${Math.round(vx)}, ${Math.round(vy)}`,
      `facing ${this.facing}`,
      `state  ${state}`,
      '─────────────────────',
      'WASD move | SPACE attack',
    ].join('\n'));
  }
}
