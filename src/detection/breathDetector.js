export class BreathDetector {
  constructor() {
    this.state = "ready";

    this.openThreshold = 8;
    this.closeThreshold = 5;

    this.lastEventTime = 0;
    this.cooldown = 600;
  }

  update(face, nearMouth, now) {
    if (!face) {
      return null;
    }

    const opening = face.mouthOpening;


    /*
      ----------------------------------------
      INHALE
      ----------------------------------------

      Cigarette MUST be near the mouth.

      First mouth opening = inhale.
    */

    if (
      this.state === "ready" &&
      nearMouth &&
      opening >= this.openThreshold
    ) {
      this.state = "inhale";

      console.log("INHALE detected");

      return "inhale";
    }


    /*
      ----------------------------------------
      CLOSE MOUTH AFTER INHALE
      ----------------------------------------
    */

    if (
      this.state === "inhale" &&
      opening <= this.closeThreshold
    ) {
      this.state = "holding";

      console.log(
        "Mouth closed - ready for exhale"
      );

      return null;
    }


    /*
      ----------------------------------------
      EXHALE
      ----------------------------------------

      IMPORTANT:
      There is NO nearMouth check here.

      The cigarette can be anywhere.
    */

    if (
      this.state === "holding" &&
      opening >= this.openThreshold &&
      now - this.lastEventTime >
        this.cooldown
    ) {
      this.state = "exhale";

      this.lastEventTime = now;

      console.log(
        "EXHALE detected - cigarette position ignored"
      );

      return "exhale";
    }


    /*
      ----------------------------------------
      CLOSE AFTER EXHALE
      ----------------------------------------

      This resets the detector.
    */

    if (
      this.state === "exhale" &&
      opening <= this.closeThreshold
    ) {
      this.state = "ready";

      console.log(
        "Ready for next inhale"
      );

      return null;
    }

    return null;
  }
}
