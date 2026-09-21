export class SmokeSystem {

  constructor() {

    this.particles =
      [];

  }


  emit(
    x,
    y,
    count = 20
  ) {

    for (
      let i = 0;
      i < count;
      i++
    ) {

      this.particles.push({

        x,

        y,

        vx:
          (Math.random() - 0.5) *
          35,

        vy:
          -20 -
          Math.random() *
          45,

        size:
          4 +
          Math.random() *
          8,

        life:
          0,

        maxLife:
          0.8 +
          Math.random() *
          1.2,

        wobble:
          Math.random() *
          Math.PI *
          2

      });

    }

  }



  update(
    dt
  ) {

    for (
      const p of this.particles
    ) {

      p.life +=
        dt;


      p.x +=
        p.vx *
        dt;


      p.y +=
        p.vy *
        dt;



      p.vx +=
        Math.sin(
          p.life * 3 +
          p.wobble
        ) *
        8 *
        dt;



      p.vy -=
        4 *
        dt;



      p.size +=
        7 *
        dt;

    }



    this.particles =
      this.particles.filter(
        p =>
          p.life <
          p.maxLife
      );

  }

  draw(
    ctx
  ) {

    ctx.save();


    for (
      const p of this.particles
    ) {

      const alpha =
        Math.max(
          0,
          1 -
            p.life /
              p.maxLife
        ) *
        0.42;


      ctx.fillStyle =
        `rgba(235,235,235,${alpha})`;


      ctx.beginPath();


      ctx.arc(

        p.x,

        p.y,

        p.size,

        0,

        Math.PI * 2

      );


      ctx.fill();

    }


    ctx.restore();

  }




  clear() {

    this.particles =
      [];

  }

}
