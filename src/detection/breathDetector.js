export class BreathDetector {

  constructor() {

    this.state =
      "idle";

    this.lastMouthOpening =
      0;

    this.lastChange =
      0;

    this.cooldownUntil =
      0;
  }


  reset() {

    this.state =
      "idle";

    this.lastMouthOpening =
      0;

    this.lastChange =
      0;

    this.cooldownUntil =
      0;
  }


  update(
    face,
    nearMouth,
    now
  ) {

   

    if (!face) {

      this.lastMouthOpening =
        0;

      return null;
    }


    
    if (!nearMouth) {

      this.lastMouthOpening =
        face.mouthOpening;

      return null;
    }


    

    if (
      now <
      this.cooldownUntil
    ) {

      this.lastMouthOpening =
        face.mouthOpening;

      return null;
    }


    const opening =
      face.mouthOpening;


    

    if (
      this.state === "idle" &&
      opening > 13
    ) {

      this.state =
        "open";

      this.lastChange =
        now;
    }


    

    if (
      this.state === "open" &&
      opening < 8 &&
      now -
        this.lastChange >
        180
    ) {

      this.state =
        "idle";


      this.cooldownUntil =
        now + 1000;


      this.lastMouthOpening =
        opening;


      return "puff";
    }


    this.lastMouthOpening =
      opening;


    return null;
  }

}
