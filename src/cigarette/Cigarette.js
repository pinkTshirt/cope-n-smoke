export class Cigarette {
  constructor() {
    this.spawn();
  }

  spawn() {
    this.width = 82;
    this.height = 8;

    this.x = 300;
    this.y = 300;

    this.targetX = 300;
    this.targetY = 300;

    this.angle = 0;

    this.puffs = 0;
    this.maxPuffs = 3;

    this.finished = false;
    this.dropComplete = false;

    this.dropVelocity = 0;
  }

  reset() {
    this.spawn();
  }

  update(dt, target, mouth) {
    if (this.finished) {
      return;
    }

    if (target) {
      this.targetX = target.x;
      this.targetY = target.y;

      this.x +=
        (this.targetX - this.x) *
        Math.min(dt * 12, 1);

      this.y +=
        (this.targetY - this.y) *
        Math.min(dt * 12, 1);
    }

    /*
      The cigarette points toward the mouth.

      Therefore:
      +X = mouth side
      -X = lit side
    */

    if (mouth) {
      const dx =
        mouth.x - this.x;

      const dy =
        mouth.y - this.y;

      this.angle =
        Math.atan2(dy, dx);
    }
  }

  isNearMouth(mouth) {
    if (!mouth) {
      return false;
    }

    const dx =
      mouth.x - this.x;

    const dy =
      mouth.y - this.y;

    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    return distance < 85;
  }

  takePuff() {
    if (this.finished) {
      return false;
    }

    if (this.puffs >= this.maxPuffs) {
      return false;
    }

    this.puffs++;

    if (this.puffs >= this.maxPuffs) {
      this.finished = true;
    }

    return true;
  }

  /*
    Get the lit/ember end in screen coordinates.
  */

  getLitEnd() {
    const remaining =
      1 - this.puffs / this.maxPuffs;

    const currentWidth =
      this.width *
      Math.max(remaining, 0.2);

    /*
      Lit side is -X because +X points toward mouth.
    */

    const localX =
      -currentWidth / 2;

    const localY = 0;

    return {
      x:
        this.x +
        Math.cos(this.angle) *
          localX -
        Math.sin(this.angle) *
          localY,

      y:
        this.y +
        Math.sin(this.angle) *
          localX +
        Math.cos(this.angle) *
          localY
    };
  }

  updateDrop(dt) {
    if (
      !this.finished ||
      this.dropComplete
    ) {
      return;
    }

    this.dropVelocity +=
      900 * dt;

    this.y +=
      this.dropVelocity * dt;

    this.angle += dt * 4;

    if (this.y > 800) {
      this.dropComplete = true;
    }
  }

  draw(ctx) {
    ctx.save();

    /*
      Pixel-art look.
    */

    ctx.imageSmoothingEnabled = false;

    ctx.translate(
      Math.round(this.x),
      Math.round(this.y)
    );

    ctx.rotate(this.angle);

    const remaining =
      1 - this.puffs / this.maxPuffs;

    const currentWidth =
      this.width *
      Math.max(remaining, 0.2);

    const h = this.height;

    const filterWidth = 18;

    const bodyWidth =
      Math.max(
        18,
        currentWidth -
          filterWidth
      );

    /*
      IMPORTANT:

      +X points toward mouth.

      Therefore brown filter is
      on the RIGHT side.

      Lit end is on the LEFT side.

      [🔥 WHITE BODY][BROWN FILTER] 👄
    */

    const left =
      -currentWidth / 2;

    /*
      White cigarette body
    */

    ctx.fillStyle = "#eeeeea";

    ctx.fillRect(
      left,
      -h / 2,
      bodyWidth,
      h
    );

    /*
      Pixel gray underside.
    */

    ctx.fillStyle = "#c7c7c2";

    ctx.fillRect(
      left,
      h / 2 - 2,
      bodyWidth,
      2
    );

    /*
      Brown filter toward mouth.
    */

    const filterX =
      left + bodyWidth;

    ctx.fillStyle = "#a86632";

    ctx.fillRect(
      filterX,
      -h / 2,
      filterWidth,
      h
    );

    /*
      Dark filter pixels.
    */

    ctx.fillStyle = "#75431f";

    ctx.fillRect(
      filterX + 3,
      -h / 2,
      3,
      h
    );

    ctx.fillRect(
      filterX + 9,
      -h / 2 + 2,
      3,
      3
    );

    ctx.fillRect(
      filterX + 14,
      -h / 2,
      2,
      h
    );

    /*
      Burning ember at the LEFT/lit end.
    */

    ctx.fillStyle = "#e84b21";

    ctx.fillRect(
      left - 4,
      -h / 2,
      4,
      h
    );

    ctx.fillStyle = "#ff8a22";

    ctx.fillRect(
      left - 3,
      -2,
      3,
      4
    );

    ctx.fillStyle = "#fff2a8";

    ctx.fillRect(
      left - 1,
      -1,
      1,
      2
    );

    ctx.restore();
  }
}
