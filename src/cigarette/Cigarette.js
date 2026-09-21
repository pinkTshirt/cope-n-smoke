function lerp(
  a,
  b,
  t
) {

  return a +
    (b - a) *
    t;
}


export class Cigarette {

  constructor() {

    this.width =
      155;

    this.height =
      15;

    this.puffs =
      0;

    this.remaining =
      1;

    this.position = {

      x: 0,
      y: 0

    };

    this.target =
      null;

    this.tip = {

      x: 0,
      y: 0

    };

    this.angle =
      0;

    this.dropY =
      0;

    this.dropVelocity =
      0;

    this.finished =
      false;

    this.dropComplete =
      false;


    this.spawn();
  }




  spawn() {

    this.puffs =
      0;

    this.remaining =
      1;

    this.finished =
      false;

    this.dropComplete =
      false;

    this.dropY =
      0;

    this.dropVelocity =
      0;

    this.target =
      null;


    this.position = {

      x:
        window.innerWidth / 2,

      y:
        window.innerHeight / 2

    };

  }




  update(
    dt,
    target,
    mouth
  ) {

    if (this.finished) {
      return;
    }


    if (target) {

      this.target =
        target;


      this.position.x =
        lerp(
          this.position.x,
          target.x,
          0.28
        );


      this.position.y =
        lerp(
          this.position.y,
          target.y,
          0.28
        );


   

      if (mouth) {

        const dx =
          mouth.x -
          this.position.x;

        const dy =
          mouth.y -
          this.position.y;


        this.angle =
          Math.atan2(
            dy,
            dx
          );
      }
    }

  }



  isNearMouth(
    mouth
  ) {

    if (
      !mouth ||
      !this.target
    ) {

      return false;
    }


    return (
      Math.hypot(

        this.position.x -
          mouth.x,

        this.position.y -
          mouth.y

      ) < 85
    );

  }


  takePuff() {

    if (
      this.finished ||
      this.puffs >= 3
    ) {

      return false;
    }


    this.puffs +=
      1;


    this.remaining =
      Math.max(
        0,
        1 -
          this.puffs /
            3
      );



    if (
      this.puffs >= 3
    ) {

      this.finished =
        true;

      this.dropY =
        0;
    }


    return true;

  }



  updateDrop(
    dt
  ) {

    if (
      !this.finished ||
      this.dropComplete
    ) {

      return;
    }


    

    this.dropVelocity +=
      900 * dt;


    this.dropY +=
      this.dropVelocity *
      dt;


    if (
      this.dropY >
      600
    ) {

      this.dropComplete =
        true;
    }

  }



  draw(
    ctx
  ) {

    const x =
      this.position.x;


    const y =
      this.position.y +
      this.dropY;


    ctx.save();


    ctx.translate(
      x,
      y
    );


    ctx.rotate(
      this.angle
    );




    const bodyWidth =
      this.width *
      this.remaining;


    if (
      bodyWidth > 2
    ) {

      const gradient =
        ctx.createLinearGradient(
          0,
          0,
          bodyWidth,
          0
        );


      gradient.addColorStop(
        0,
        "#f7f2df"
      );


      gradient.addColorStop(
        1,
        "#d8cbb1"
      );


      ctx.fillStyle =
        gradient;


      ctx.fillRect(

        0,

        -this.height / 2,

        bodyWidth,

        this.height

      );

    }




    if (
      bodyWidth > 1
    ) {

      ctx.fillStyle =
        "#ff5a2a";


      ctx.beginPath();


      ctx.arc(

        bodyWidth,

        0,

        7,

        0,

        Math.PI * 2

      );


      ctx.fill();


      ctx.fillStyle =
        "#ffd166";


      ctx.beginPath();


      ctx.arc(

        bodyWidth,

        0,

        3,

        0,

        Math.PI * 2

      );


      ctx.fill();

    }



    ctx.fillStyle =
      "#d6a77a";


    ctx.fillRect(

      bodyWidth,

      -this.height / 2,

      30,

      this.height

    );


    ctx.strokeStyle =
      "rgba(255,255,255,.5)";


    ctx.strokeRect(

      bodyWidth,

      -this.height / 2,

      30,

      this.height

    );


    ctx.restore();



    this.tip = {

      x:
        x +
        Math.cos(
          this.angle
        ) *
        (bodyWidth + 8),

      y:
        y +
        Math.sin(
          this.angle
        ) *
        (bodyWidth + 8)

    };

  }

}
