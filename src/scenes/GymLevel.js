import { AssetLoader } from '../utils/AssetLoader.js';
import { Ninja }       from '../entities/Ninja.js';

// ─── Constants ───────────────────────────────────────────────────────────────
const BULLET_SPEED  = 220;
const BULLET_LIFE   = 600;
const ATTACK_LOCK   = 350;
const BULLET_COLOR  = 0xffee44;
const BULLET_R      = 3;
const PLAYER_HP     = 5;

// Wave definitions: each entry is { type, edge }
const WAVES = [
  [
    { type: 'ninjaBlue',   edge: 'left'   },
    { type: 'ninjaBlue',   edge: 'right'  },
    { type: 'ninjaBlue',   edge: 'top'    },
  ],
  [
    { type: 'ninjaRed',    edge: 'left'   },
    { type: 'ninjaRed',    edge: 'right'  },
    { type: 'ninjaBlue',   edge: 'top'    },
    { type: 'ninjaBlue',   edge: 'bottom' },
    { type: 'ninjaRed',    edge: 'top'    },
  ],
  [
    { type: 'ninjaYellow', edge: 'left'   },
    { type: 'ninjaYellow', edge: 'right'  },
    { type: 'ninjaRed',    edge: 'top'    },
    { type: 'ninjaRed',    edge: 'bottom' },
    { type: 'ninjaBlue',   edge: 'left'   },
    { type: 'ninjaBlue',   edge: 'right'  },
    { type: 'ninjaYellow', edge: 'top'    },
  ],
];

// ─── Scene ───────────────────────────────────────────────────────────────────
export class GymLevel extends Phaser.Scene {
  constructor() {
    super('GymLevel');
    this.player    = null;
    this.keys      = null;
    this.facing    = 'down';
    this.attacking = false;
    this.bullets   = null;
    this.ninjas    = [];
    this.hp        = PLAYER_HP;
    this.waveIndex = 0;
    this.waveActive = false;
    this.debugEnabled = true;
    this._target   = null;   // { x, y } mouse click destination
  }

  preload() {
    const loader = new AssetLoader(this);
    loader.load();
    this._loader = loader;
  }

  create() {
    this._loader.createAnimations();
    this._buildAllAnims();
    this._initSounds();

    this.createWorld();
    this.createBullets();
    this.createPlayer();
    this.createKeys();
    this.createHUD();
    this.createDebugUI();

    this.cameras.main.setBounds(0, 0, 320, 240);
    this.cameras.main.startFollow(this.player);

    this.sfx.game_start.play();
    this.time.delayedCall(1200, () => this._startWave(0));
  }

  _initSounds() {
    this.sfx = {
      shot:        this.sound.add('sfx_shot',        { volume: 0.6 }),
      ninja_death: this.sound.add('sfx_ninja_death', { volume: 0.7 }),
      new_wave:    this.sound.add('sfx_new_level',   { volume: 0.8 }),
      game_start:  this.sound.add('sfx_game_start',  { volume: 0.7 }),
      game_over:   this.sound.add('sfx_game_over',   { volume: 0.8 }),
      boy_hurt:    this.sound.add('sfx_boy_hurt',    { volume: 0.8 }),
    };
  }

  // ─── Animations ────────────────────────────────────────────────────────────

  _buildAllAnims() {
    const chars = ['boy', 'ninjaBlue', 'ninjaRed', 'ninjaYellow'];
    const dirs  = { down: 0, up: 1, left: 2, right: 3 };

    chars.forEach(char => {
      Object.entries(dirs).forEach(([dir, col]) => {
        this._anim(`${char}_walk_${dir}`,   `${char}_walk`,   [0,4,8,12].map(r => r + col), 10, -1);
        this._anim(`${char}_idle_${dir}`,   `${char}_idle`,   [col], 1, -1);
        this._anim(`${char}_attack_${dir}`, `${char}_attack`, [col], 12, 0);
      });
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

  // ─── World ─────────────────────────────────────────────────────────────────

  createWorld() {
    this.add.rectangle(160, 120, 320, 240, 0x3b2a1a);

    const wall = 0x5a4030;
    this.add.rectangle(160,   8, 320, 16, wall);
    this.add.rectangle(160, 232, 320, 16, wall);
    this.add.rectangle(  8, 120, 16, 240, wall);
    this.add.rectangle(312, 120, 16, 240, wall);

    this.add.rectangle( 56,  80, 48, 32, 0x888888);
    this.add.rectangle( 40,  80,  8, 32, 0x555555);
    this.add.rectangle( 72,  80,  8, 32, 0x555555);

    this.add.rectangle(160, 168, 64, 12, 0x6b3a2a);
    this.add.rectangle(160, 156,  8, 12, 0x888888);

    this.add.rectangle(264,  80, 40, 28, 0x333355);
    this.add.rectangle(264, 100, 40,  4, 0x222244);

    const g = this.add.graphics();
    g.lineStyle(1, 0x4a3520, 0.6);
    for (let x = 16; x < 320; x += 32) g.lineBetween(x, 16, x, 224);
    for (let y = 16; y < 240; y += 32) g.lineBetween(16, y, 304, y);

    this.physics.world.setBounds(16, 16, 288, 208);
  }

  // ─── Bullets ───────────────────────────────────────────────────────────────

  createBullets() {
    const gfx = this.make.graphics({ add: false });
    gfx.fillStyle(BULLET_COLOR);
    gfx.fillCircle(BULLET_R, BULLET_R, BULLET_R);
    gfx.generateTexture('bullet', BULLET_R * 2, BULLET_R * 2);
    gfx.destroy();

    this.bullets = this.physics.add.group({ defaultKey: 'bullet', maxSize: 20 });
  }

  _fireBullet() {
    const b = this.bullets.get(this.player.x, this.player.y);
    if (!b) return;
    b.setActive(true).setVisible(true).setDepth(10);
    b.body.reset(this.player.x, this.player.y);
    b.body.setAllowGravity(false);

    const v = { right:[BULLET_SPEED,0], left:[-BULLET_SPEED,0], down:[0,BULLET_SPEED], up:[0,-BULLET_SPEED] };
    const [vx, vy] = v[this.facing];
    b.body.setVelocity(vx, vy);

    this.time.delayedCall(BULLET_LIFE, () => {
      if (b.active) b.setActive(false).setVisible(false);
    });
  }

  // ─── Player ────────────────────────────────────────────────────────────────

  createPlayer() {
    this.player = this.physics.add.sprite(160, 120, 'boy_idle');
    this.player.setScale(3).setDepth(5);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(12, 12);
    this.player.play('boy_idle_down');
  }

  _playerHit() {
    if (this.hp <= 0) return;
    this.hp--;
    this._updateHpBar();

    this.sfx.boy_hurt.play();
    // Flash red
    this.player.setTint(0xff4444);
    this.time.delayedCall(200, () => this.player.clearTint());

    if (this.hp <= 0) this._gameOver();
  }

  // ─── Input ─────────────────────────────────────────────────────────────────

  createKeys() {
    this.keys = this.input.keyboard.addKeys({
      attack: Phaser.Input.Keyboard.KeyCodes.SPACE,
      debug:  Phaser.Input.Keyboard.KeyCodes.BACKTICK,
    });

    this.keys.attack.on('down', () => {
      if (!this.attacking) {
        this.attacking = true;
        this._target = null;  // cancel movement while attacking
        this.player.play(`boy_attack_${this.facing}`);
        this._fireBullet();
        this.sfx.shot.play();
        this.time.delayedCall(ATTACK_LOCK, () => { this.attacking = false; });
      }
    });

    this.keys.debug.on('down', () => {
      this.debugEnabled = !this.debugEnabled;
      if (!this.debugEnabled) this.debugText.setText('');
    });

    // Left-click to move
    this.input.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        // Convert screen coords to world coords (camera may be offset)
        const wx = pointer.worldX;
        const wy = pointer.worldY;
        this._target = { x: wx, y: wy };
        this._spawnClickMarker(wx, wy);
      }
    });
  }

  _spawnClickMarker(x, y) {
    const marker = this.add.graphics().setDepth(8);
    marker.lineStyle(1, 0xffffff, 0.8);
    marker.strokeCircle(0, 0, 4);
    marker.strokeCircle(0, 0, 2);
    marker.setPosition(x, y);
    this.tweens.add({
      targets: marker,
      alpha: 0,
      scaleX: 2,
      scaleY: 2,
      duration: 350,
      onComplete: () => marker.destroy(),
    });
  }

  // ─── HUD ───────────────────────────────────────────────────────────────────

  createHUD() {
    // Wave label
    this.waveText = this.add.text(160, 6, '', {
      fontSize: '10px', fontFamily: 'monospace',
      fill: '#ffff00', align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(1000);

    // HP dots
    this.hpDots = [];
    for (let i = 0; i < PLAYER_HP; i++) {
      const dot = this.add.circle(304 - i * 10, 8, 3, 0xff4444)
        .setScrollFactor(0).setDepth(1000);
      this.hpDots.push(dot);
    }

    // Banner text (wave announcements)
    this.bannerText = this.add.text(160, 100, '', {
      fontSize: '14px', fontFamily: 'monospace',
      fill: '#ffffff', stroke: '#000000', strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setAlpha(0);
  }

  _updateHpBar() {
    this.hpDots.forEach((dot, i) => dot.setAlpha(i < this.hp ? 1 : 0.15));
  }

  _showBanner(msg, color = '#ffffff', duration = 1800) {
    this.bannerText.setText(msg).setColor(color).setAlpha(1);
    this.tweens.add({
      targets: this.bannerText,
      alpha: 0,
      delay: duration - 400,
      duration: 400,
    });
  }

  // ─── Waves ─────────────────────────────────────────────────────────────────

  _startWave(index) {
    const waveNum = index + 1;
    this.waveActive = true;
    this.waveText.setText(`WAVE ${waveNum}`);
    this._showBanner(`WAVE ${waveNum}`, '#ffff44');

    const defs = WAVES[index % WAVES.length];
    // For waves beyond the defined list, add a speed multiplier
    const extraSpeed = Math.floor(index / WAVES.length) * 0.2;

    defs.forEach((def, i) => {
      this.time.delayedCall(400 + i * 500, () => {
        const ninja = this._spawnNinja(def.type, def.edge);
        ninja.speed *= (1 + extraSpeed);
        this.ninjas.push(ninja);

        // Bullet → ninja overlap
        this.physics.add.overlap(this.bullets, ninja.sprite, (bullet) => {
          if (!bullet.active) return;
          bullet.setActive(false).setVisible(false);
          if (ninja.takeDamage()) {
            this.sfx.ninja_death.play();
            this._checkWaveComplete();
          }
        });
      });
    });
  }

  _spawnNinja(type, edge) {
    const R = Phaser.Math.Between;
    let x, y;
    switch (edge) {
      case 'left':   x = 18;        y = R(20, 220); break;
      case 'right':  x = 302;       y = R(20, 220); break;
      case 'top':    x = R(20, 300); y = 18;         break;
      case 'bottom': x = R(20, 300); y = 222;        break;
    }
    return new Ninja(this, x, y, type);
  }

  _checkWaveComplete() {
    const allDead = this.ninjas.every(n => !n.alive);
    if (!allDead || !this.waveActive) return;

    this.waveActive = false;
    this._showBanner('WAVE CLEAR!', '#44ff88');

    this.sfx.new_wave.play();
    this.time.delayedCall(2200, () => {
      this.ninjas = this.ninjas.filter(n => n.alive);
      this.waveIndex++;
      this._startWave(this.waveIndex);
    });
  }

  _gameOver() {
    this.physics.pause();
    this.sfx.game_over.play();
    this._showBanner('GAME OVER', '#ff4444', 99999);
    this.waveText.setText('');
    this.ninjas.forEach(n => n.sprite.body?.setVelocity(0, 0));
  }

  // ─── Debug ─────────────────────────────────────────────────────────────────

  createDebugUI() {
    this.debugText = this.add.text(4, 4, '', {
      fontSize: '9px', fontFamily: 'monospace',
      fill: '#00ff00', backgroundColor: '#000000cc',
      padding: { x: 4, y: 4 },
    }).setScrollFactor(0).setDepth(1000);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  update() {
    let vx = 0, vy = 0;

    if (!this.attacking && this._target) {
      const dx   = this._target.x - this.player.x;
      const dy   = this._target.y - this.player.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 3) {
        // Reached destination
        this._target = null;
      } else {
        const speed = 80;
        vx = (dx / dist) * speed;
        vy = (dy / dist) * speed;

        // Update facing based on dominant axis
        if (Math.abs(dx) > Math.abs(dy)) {
          this.facing = dx > 0 ? 'right' : 'left';
        } else {
          this.facing = dy > 0 ? 'down' : 'up';
        }
      }
    }

    this.player.body.setVelocity(vx, vy);

    if (!this.attacking) {
      const moving = vx !== 0 || vy !== 0;
      const want   = moving ? `boy_walk_${this.facing}` : `boy_idle_${this.facing}`;
      if (this.player.anims.currentAnim?.key !== want) this.player.play(want);
    }

    // Update ninjas
    const now = this.time.now;
    this.ninjas.forEach(n => {
      if (!n.alive) return;
      n.update(this.player.x, this.player.y, now);
      if (n.didHit(now)) this._playerHit();
    });

    if (this.debugEnabled) {
      const state = this.attacking ? 'ATTACKING' : (vx || vy ? 'WALKING' : 'IDLE');
      this.debugText.setText([
        '[ DEBUG ]  ` to toggle',
        '─────────────────────',
        `pos    ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`,
        `facing ${this.facing}  state ${state}`,
        `hp     ${this.hp}/${PLAYER_HP}`,
        `wave   ${this.waveIndex + 1}  enemies ${this.ninjas.filter(n => n.alive).length}`,
        '─────────────────────',
        'CLICK to move | SPACE attack',
      ].join('\n'));
    }
  }
}
