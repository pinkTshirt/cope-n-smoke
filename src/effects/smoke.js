export class SmokeSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count = 60) {
    console.log(
      "SMOKE EMITTED AT:",
      x,
      y
    );

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x:
          x +
          (Math.random() - 0.5) * 8,

        y:
          y +
          (Math.random() - 0.5) * 8,

        vx:
          (Math.random() - 0.5) * 35,

        vy:
          -30 -
          Math.random() * 60,

        size:
          5 +
          Math.random() * 9,

        life:
          2 +
          Math.random() * 2,

        maxLife:
          2 +
          Math.random() * 2
      });
    }
  }

  update(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Smoke rises
      p.vy -= 5 * dt;

      // Smoke slowly gets bigger
      p.size += 7 * dt;

      p.life -= dt;
    }

    this.particles =
      this.particles.filter(
        (p) => p.life > 0
      );
  }

  draw(ctx) {
    ctx.save();

    ctx.imageSmoothingEnabled =
      false;

    for (const p of this.particles) {
      const alpha =
        Math.min(
          0.8,
          p.life / p.maxLife
        );

      ctx.globalAlpha = alpha;

      ctx.fillStyle =
        "#d6d6d6";

      const size =
        Math.max(
          4,
          Math.round(p.size)
        );

      /*
        Pixelated smoke.
      */

      ctx.fillRect(
        Math.round(p.x),
        Math.round(p.y),
        size,
        size
      );

      if (size > 7) {
        ctx.fillRect(
          Math.round(p.x - 4),
          Math.round(p.y + 5),
          Math.round(size * 0.5),
          Math.round(size * 0.5)
        );
      }
    }

    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}
