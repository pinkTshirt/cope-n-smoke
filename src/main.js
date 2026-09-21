import "./styles/main.css";

import { CameraController } from "./camera.js";
import { VisionTracker } from "./tracking/visionTracker.js";
import { Cigarette } from "./cigarette/Cigarette.js";
import { SmokeSystem } from "./effects/smoke.js";
import { BreathDetector } from "./detection/breathDetector.js";


const video =
  document.querySelector("#camera");

const canvas =
  document.querySelector("#overlay");

const ctx =
  canvas.getContext("2d");

const statusEl =
  document.querySelector("#status");

const startButton =
  document.querySelector("#start-camera");

const resetButton =
  document.querySelector("#reset");

const debugToggle =
  document.querySelector("#debug");

const startCard =
  document.querySelector("#start-card");


// Puff indicators

const puffDots = [
  document.querySelector("#puff-1"),
  document.querySelector("#puff-2"),
  document.querySelector("#puff-3")
];


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



let running = false;

let lastFrame =
  performance.now();

let lastVideoTime = -1;


function resizeCanvas() {

  const rect =
    video.getBoundingClientRect();

  const dpr =
    Math.min(
      window.devicePixelRatio || 1,
      2
    );

  canvas.width =
    Math.max(
      1,
      Math.round(rect.width * dpr)
    );

  canvas.height =
    Math.max(
      1,
      Math.round(rect.height * dpr)
    );

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );
}



function setStatus(text) {

  statusEl.textContent =
    text;
}


function updatePuffUI() {

  puffDots.forEach(
    (dot, index) => {

      dot.classList.toggle(
        "used",
        index < cigarette.puffs
      );

    }
  );
}



function clearCanvas() {

  const rect =
    video.getBoundingClientRect();

  ctx.clearRect(
    0,
    0,
    rect.width,
    rect.height
  );
}

//debug
function drawDebug(
  hand,
  face,
  mouth
) {

  if (!debugToggle.checked) {
    return;
  }

  ctx.save();


  // Hand

  ctx.fillStyle =
    "#00e5ff";

  if (hand?.indexTip) {

    ctx.beginPath();

    ctx.arc(
      hand.indexTip.x,
      hand.indexTip.y,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }




  if (face?.mouthCenter) {

    ctx.fillStyle =
      "#ff4f81";

    ctx.beginPath();

    ctx.arc(
      face.mouthCenter.x,
      face.mouthCenter.y,
      5,
      0,
      Math.PI * 2
    );

    ctx.fill();
  }



  if (mouth) {

    ctx.strokeStyle =
      "#ffffff";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      mouth.x - 12,
      mouth.y - 8,
      24,
      16
    );
  }


  ctx.restore();
}


//animation loop

function loop(now) {

  if (!running) {
    return;
  }


  const dt =
    Math.min(
      (now - lastFrame) / 1000,
      0.05
    );

  lastFrame =
    now;



  if (
    video.readyState >= 2 &&
    video.currentTime !== lastVideoTime
  ) {

    lastVideoTime =
      video.currentTime;


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


    const target =
      hand?.indexTip
        ? {

            x:
              hand.indexTip.x +
              hand.direction.x * 30,

            y:
              hand.indexTip.y +
              hand.direction.y * 30

          }
        : null;


    cigarette.update(
      dt,
      target,
      face?.mouthCenter ?? null
    );


    const mouth =
      face
        ? {
            x: face.mouthCenter.x,
            y: face.mouthCenter.y
          }
        : null;



    const nearMouth =
      cigarette.isNearMouth(
        mouth
      );


    const breathEvent =
      breathDetector.update(
        face,
        nearMouth,
        now
      );


    if (
      breathEvent === "puff"
    ) {

      const accepted =
        cigarette.takePuff();


      if (accepted) {

        smoke.emit(
          cigarette.tip.x,
          cigarette.tip.y,
          26
        );


        setStatus(
          cigarette.finished
            ? "Cigarette finished — dropping..."
            : `Puff ${cigarette.puffs}/3`
        );


        updatePuffUI();
      }
    }

    if (cigarette.finished) {

      cigarette.updateDrop(
        dt
      );


      if (cigarette.dropComplete) {

        cigarette.spawn();

        updatePuffUI();

        setStatus(
          "New cigarette ready."
        );
      }
    }

    clearCanvas();


    cigarette.draw(
      ctx
    );


    smoke.update(
      dt
    );


    smoke.draw(
      ctx
    );


    drawDebug(
      hand,
      face,
      mouth
    );
  }


  requestAnimationFrame(
    loop
  );
}

async function start() {

  startButton.disabled =
    true;

  setStatus(
    "Loading hand and face tracking..."
  );


  try {

    await tracker.load();

    await camera.start();

    resizeCanvas();


    startCard.classList.add(
      "hidden"
    );


    resetButton.disabled =
      false;


    running =
      true;


    setStatus(
      "Camera active — move your hand into view."
    );


    requestAnimationFrame(
      loop
    );

  } catch (error) {

    console.error(
      error
    );


    startButton.disabled =
      false;


    setStatus(
      `Could not start camera: ${error.message}`
    );
  }
}



startButton.addEventListener(
  "click",
  start
);


resetButton.addEventListener(
  "click",
  () => {

    cigarette.spawn();

    smoke.clear();

    breathDetector.reset();

    updatePuffUI();

    setStatus(
      "Cigarette reset."
    );
  }
);


window.addEventListener(
  "resize",
  resizeCanvas
);


// Initial UI

updatePuffUI();
