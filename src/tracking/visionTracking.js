import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker
} from "@mediapipe/tasks-vision";


const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm";


const HAND_MODEL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";


const FACE_MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";




function distance(a, b) {

  return Math.hypot(
    a.x - b.x,
    a.y - b.y
  );

}


function average(a, b) {

  return {

    x:
      (a.x + b.x) / 2,

    y:
      (a.y + b.y) / 2

  };

}



export class VisionTracker {

  constructor() {

    this.handLandmarker =
      null;

    this.faceLandmarker =
      null;
  }



  async load() {

    const vision =
      await FilesetResolver.forVisionTasks(
        WASM_PATH
      );


    [
      this.handLandmarker,
      this.faceLandmarker
    ] =
      await Promise.all([

        // HAND

        HandLandmarker.createFromOptions(
          vision,
          {

            baseOptions: {

              modelAssetPath:
                HAND_MODEL,

              delegate:
                "GPU"

            },

            runningMode:
              "VIDEO",

            numHands:
              1,

            minHandDetectionConfidence:
              0.5,

            minHandPresenceConfidence:
              0.5,

            minTrackingConfidence:
              0.5

          }
        ),


        

        FaceLandmarker.createFromOptions(
          vision,
          {

            baseOptions: {

              modelAssetPath:
                FACE_MODEL,

              delegate:
                "GPU"

            },

            runningMode:
              "VIDEO",

            numFaces:
              1,

            outputFaceBlendshapes:
              true,

            minFaceDetectionConfidence:
              0.5,

            minFacePresenceConfidence:
              0.5,

            minTrackingConfidence:
              0.5

          }
        )

      ]);
  }



  detect(
    video,
    timestamp
  ) {

    return {

      hands:
        this.handLandmarker.detectForVideo(
          video,
          timestamp
        ),

      faces:
        this.faceLandmarker.detectForVideo(
          video,
          timestamp
        )

    };

  }



  getHandInteraction(
    results,
    rect
  ) {

    const landmarks =
      results
        .hands
        ?.landmarks
        ?.[0];


    if (!landmarks) {
      return null;
    }


    

    const indexTip =
      landmarks[8];

    const indexMcp =
      landmarks[5];

    const thumbTip =
      landmarks[4];


    

    const toScreen =
      (p) => ({

        x:
          rect.width *
          (1 - p.x),

        y:
          rect.height *
          p.y

      });


    const tip =
      toScreen(
        indexTip
      );


    const mcp =
      toScreen(
        indexMcp
      );


    const thumb =
      toScreen(
        thumbTip
      );


    

    const directionRaw = {

      x:
        tip.x -
        mcp.x,

      y:
        tip.y -
        mcp.y

    };


    const length =
      Math.hypot(
        directionRaw.x,
        directionRaw.y
      ) || 1;


    return {

      indexTip:
        tip,

      thumbTip:
        thumb,

      direction: {

        x:
          directionRaw.x /
          length,

        y:
          directionRaw.y /
          length

      }

    };

  }




  getFaceInteraction(
    results,
    rect
  ) {

    const landmarks =
      results
        .faces
        ?.faceLandmarks
        ?.[0];


    if (!landmarks) {
      return null;
    }




    const upper =
      landmarks[13];

    const lower =
      landmarks[14];




    const toScreen =
      (p) => ({

        x:
          rect.width *
          (1 - p.x),

        y:
          rect.height *
          p.y

      });


    const upperScreen =
      toScreen(
        upper
      );


    const lowerScreen =
      toScreen(
        lower
      );


    const mouthCenter =
      average(
        upperScreen,
        lowerScreen
      );




    const mouthOpening =
      distance(
        upper,
        lower
      ) *
      rect.height;


    return {

      mouthCenter,

      mouthOpening,

      upperLip:
        upperScreen,

      lowerLip:
        lowerScreen

    };

  }

}
