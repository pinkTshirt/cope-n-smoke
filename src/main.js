import "./styles/main.css";

import { CameraController } from "./camera.js";

import { VisionTracker } from "./tracking/visionTracker.js";

import { Cigarette } from "./cigarette/Cigarette.js";

import { SmokeSystem } from "./effects/smoke.js";

import { BreathDetector } from "./detection/breathDetector.js";


/* --------------------------------------------------
   DOM
-------------------------------------------------- */

const video =
  document.getElementById("camera");

const canvas =
  document.getElementById("overlay");

const ctx =
  canvas.getContext("2d");

const startCard =
  document.getElementById("startCard");

const startButton =
  document.getElementById("startButton");

const resetButton =
  document.getElementById("resetButton");

const debugToggle =
  document.getElementById("debugToggle");

const statusElement =
  document.getElementById("status");

const puffCount =
  document.getElementById("puffCount");

const puffDots = [
  document.getElementById("puff1"),
  document.getElementById("puff2"),
  document.getElementById("puff3")
];


/* --------------------------------------------------
   Safety check
-------------------------------------------------- */

if (!video) {
  throw new Error(
    'Missing element: "#camera"'
  );
}

if (!canvas) {
  throw new Error(
    'Missing element: "#overlay"'
  );
}

if (!startButton) {
  throw new Error(
    'Missing element: "#startButton"'
  );
}

if (!resetButton) {
  throw new Error(
    'Missing element: "#resetButton"'
  );
}


/* --------------------------------------------------
   Systems
-------------------------------------------------- */

const camera =
  new CameraController(video);

const tracker =
  new VisionTracker();

const cigarette =
  new Cigarette();

const smoke =
  new SmokeSystem();

const breathDetector =
  new BreathDetector();


/* --------------------------------------------------
   State
-------------------------------------------------- */

let running = false;

let lastFrame =
  performance.now();

let lastVideoTime = -1;

let debugEnabled = false;


/* --------------------------------------------------
   UI
-------------------------------------------------- */

function setStatus(message) {
  statusElement.textContent =
    message;
}

function updatePuffUI() {
  puffCount.textContent =
    `Puffs: ${cigarette.puffs}/3`;

  puffDots.forEach(
    (dot, index) => {
      if (!dot) return;

      dot.classList.toggle(
        "active",
        index < cigarette.puffs
      );
    }
  );
}


/* --------------------------------------------------
   Canvas
-------------------------------------------------- */

function resizeCanvas() {
  const rect =
    video.getBoundingClientRect();

  const width =
    Math.round(rect.width);

  const height =
    Math.round(rect.height);

  if (
    canvas.width !== width ||
    canvas.height !== height
  ) {
    canvas.width = width;
    canvas.height = height;
  }
}

function clearCanvas() {
  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
}


/* --------------------------------------------------
   Debug
-------------------------------------------------- */

function drawDebug(
  hand,
  face
) {
  if (!debugEnabled) {
    return;
  }

  ctx.save();

  /*
    Hand point
  */

  if (hand?.indexTip) {
    ctx.fillStyle =
      "#00e5ff";

    ctx.beginPath();

    ctx.arc(
      hand.indexTip.x,
      hand.indexTip.y,
      7,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  /*
    Mouth point
  */

  if (face?.mouthCenter) {
    ctx.fillStyle =
      "#ff4d8d";

    ctx.beginPath();

    ctx.arc(
      face.mouthCenter.x,
      face.mouthCenter.y,
      6,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }

  ctx.restore();
}


/* --------------------------------------------------
   Tracking loop
-------------------------------------------------- */

function loop(now) {
  if (!running) {
    return;
  }

  const dt =
    Math.min(
      (now - lastFrame) / 1000,
      0.05
    );

  lastFrame = now;


  /*
    Only process a new video frame.
  */

  if (
    video.readyState >= 2 &&
    video.currentTime !==
      lastVideoTime
  ) {
    lastVideoTime =
      video.currentTime;

    try {
      const results =
        tracker.detect(
          video,
          now
        );

      const rect =
        video.getBoundingClientRect();

      const hand =
        tracker.getHandInteraction(
          results,
          rect
        );

      const face =
        tracker.getFaceInteraction(
          results,
          rect
        );


      /*
        Cigarette follows index finger.
      */

      let target = null;

      if (hand?.indexTip) {
        target = {
          x:
            hand.indexTip.x +
            hand.direction.x * 28,

          y:
            hand.indexTip.y +
            hand.direction.y * 28
        };
      }


      /*
        Cigarette follows hand
        and rotates toward mouth.
      */

      cigarette.update(
        dt,
        target,
        face?.mouthCenter ?? null
      );


      const nearMouth =
        cigarette.isNearMouth(
          face?.mouthCenter ?? null
        );


      /*
        Detect inhale / exhale.
      */

      const breathEvent =
        breathDetector.update(
          face,
          nearMouth,
          now
        );


      /*
        INHALE:
        shorten cigarette.
        NO smoke.
      */

      if (
        breathEvent ===
        "inhale"
      ) {
        const accepted =
          cigarette.takePuff();

        if (accepted) {
          updatePuffUI();

          if (
            cigarette.finished
          ) {
            setStatus(
              "Cigarette finished — dropping..."
            );
          } else {
            setStatus(
              `Puff ${cigarette.puffs}/3`
            );
          }
        }
      }


      /*
        EXHALE:
        release smoke only.
      */

      if (
  breathEvent ===
  "exhale"
) {
  /*
    EXHALE SMOKE COMES FROM THE MOUTH,
    NOT THE CIGARETTE.

    This means the cigarette can be
    anywhere on screen when you exhale.
  */

  if (face?.mouthCenter) {
    const mouth = face.mouthCenter;

    console.log(
      "💨 EXHALE — smoke from mouth",
      mouth
    );

    smoke.emit(
      mouth.x,
      mouth.y,
      60
    );

    setStatus(
      "💨 Exhale — smoke released"
    );
  }
}


      /*
        Finished cigarette drops.
      */

      if (
        cigarette.finished
      ) {
        cigarette.updateDrop(dt);

        if (
          cigarette.dropComplete
        ) {
          cigarette.spawn();

          updatePuffUI();

          setStatus(
            "New cigarette ready."
          );
        }
      }


      /*
        Draw.
      */

      clearCanvas();

      cigarette.draw(ctx);

      smoke.update(dt);

      smoke.draw(ctx);

      drawDebug(
        hand,
        face
      );

    } catch (error) {
      console.error(
        "Tracking error:",
        error
      );

      setStatus(
        "Tracking error — check Console."
      );
    }
  }

  requestAnimationFrame(loop);
}


/* --------------------------------------------------
   Start camera
-------------------------------------------------- */

async function start() {
  startButton.disabled =
    true;

  setStatus(
    "Loading hand and face tracking..."
  );

  try {
    /*
      Load MediaPipe first.
    */

    await tracker.load();

    setStatus(
      "Tracking loaded. Starting camera..."
    );


    /*
      Start webcam.
    */

    await camera.start();


    /*
      Size canvas.
    */

    resizeCanvas();


    /*
      Hide start screen.
    */

    startCard.classList.add(
      "hidden"
    );


    resetButton.disabled =
      false;

    running = true;

    setStatus(
      "Camera active — move your hand into view."
    );

    lastFrame =
      performance.now();

    requestAnimationFrame(
      loop
    );

  } catch (error) {
    console.error(
      "START ERROR:",
      error
    );

    startButton.disabled =
      false;

    setStatus(
      `Could not start: ${
        error?.message ||
        String(error)
      }`
    );
  }
}


/* --------------------------------------------------
   Reset
-------------------------------------------------- */

function reset() {
  cigarette.reset();

  smoke.clear();

  updatePuffUI();

  setStatus(
    running
      ? "Cigarette reset."
      : "Camera inactive"
  );
}


/* --------------------------------------------------
   Events
-------------------------------------------------- */

startButton.addEventListener(
  "click",
  start
);

resetButton.addEventListener(
  "click",
  reset
);

debugToggle.addEventListener(
  "change",
  () => {
    debugEnabled =
      debugToggle.checked;
  }
);

window.addEventListener(
  "resize",
  resizeCanvas
);


/* --------------------------------------------------
   Initial UI
-------------------------------------------------- */

updatePuffUI();

setStatus(
  "Camera inactive"
);
