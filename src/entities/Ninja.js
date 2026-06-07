const SPEED         = { ninjaBlue: 42, ninjaRed: 56, ninjaYellow: 70 };
const ATTACK_RANGE  = 18;
const ATTACK_EVERY  = 1100;

export class Ninja {
  constructor(scene, x, y, type) {
    this.scene  = scene;
    this.type   = type;
    this.speed  = SPEED[type] || 50;
    this.state  = 'walk';
    this.dead   = false;
    this._nextAttack = 0;

    this.sprite = scene.physics.add.sprite(x, y, `${type}_walk`);
    this.sprite.setScale(3).setDepth(4);
    this.sprite.body.setCollideWorldBounds(true);
    this.sprite.body.setSize(10, 10);
    this.sprite._ninja = this;
  }

  update(px, py, time) {
    if (this.dead || this.state === 'dying') return;

    const dx   = px - this.sprite.x;
    const dy   = py - this.sprite.y;
    const dist = Math.hypot(dx, dy);

    if (dist < ATTACK_RANGE) {
      this._doAttack();
    } else {
      this._doWalk(dx, dy, dist);
    }
  }

  _doWalk(dx, dy, dist) {
    this.state = 'walk';
    const vx = (dx / dist) * this.speed;
    const vy = (dy / dist) * this.speed;
    this.sprite.body.setVelocity(vx, vy);
    const anim = `${this.type}_walk_${this._dir(vx, vy)}`;
    if (this.sprite.anims.currentAnim?.key !== anim) this.sprite.play(anim);
  }

  _doAttack() {
    this.sprite.body.setVelocity(0, 0);
    if (this.state !== 'attack') {
      this.state = 'attack';
      const lastDir = this._lastDir ?? 'down';
      this.sprite.play(`${this.type}_attack_${lastDir}`);
    }
  }

  didHit(time) {
    if (this.state !== 'attack' || this.dead) return false;
    if (time > this._nextAttack) {
      this._nextAttack = time + ATTACK_EVERY;
      return true;
    }
    return false;
  }

  takeDamage() {
    if (this.dead) return false;
    this.dead  = true;
    this.state = 'dying';
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.enable = false;
    this.sprite.setTexture(`${this.type}_dead`, 0);
    this.scene.tweens.add({
      targets:  this.sprite,
      alpha:    0,
      y:        this.sprite.y - 6,
      duration: 450,
      onComplete: () => this.sprite.destroy(),
    });
    return true;
  }

  get alive() { return !this.dead && this.sprite?.active; }

  _dir(vx, vy) {
    const d = Math.abs(vx) > Math.abs(vy)
      ? (vx > 0 ? 'right' : 'left')
      : (vy > 0 ? 'down'  : 'up');
    this._lastDir = d;
    return d;
  }
}
