import {
  FilesetResolver,
  HandLandmarker,
  FaceLandmarker
} from "@mediapipe/tasks-vision";

export class VisionTracker {
  constructor() {
    this.handLandmarker = null;
    this.faceLandmarker = null;

    this.loaded = false;

    /*
      IMPORTANT:
      MediaPipe WASM is served locally from /public/wasm.
    */
    this.wasmPath = "/wasm";

    this.handModelPath =
      "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

    this.faceModelPath =
      "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
  }

  async load() {
    console.log("Loading MediaPipe...");

    try {
      const vision =
        await FilesetResolver.forVisionTasks(
          this.wasmPath
        );

      console.log("WASM loaded.");

      this.handLandmarker =
        await HandLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                this.handModelPath,
              delegate: "CPU"
            },

            runningMode: "VIDEO",

            numHands: 1,

            minHandDetectionConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
            minTrackingConfidence: 0.35
          }
        );

      console.log("Hand tracker loaded.");

      this.faceLandmarker =
        await FaceLandmarker.createFromOptions(
          vision,
          {
            baseOptions: {
              modelAssetPath:
                this.faceModelPath,
              delegate: "CPU"
            },

            runningMode: "VIDEO",

            numFaces: 1,

            minFaceDetectionConfidence: 0.35,
            minFacePresenceConfidence: 0.35,
            minTrackingConfidence: 0.35
          }
        );

      console.log("Face tracker loaded.");

      this.loaded = true;
    } catch (error) {
      console.error(
        "MediaPipe loading error:",
        error
      );

      throw new Error(
        `MediaPipe could not load: ${
          error?.message || String(error)
        }`
      );
    }
  }

  detect(video, timestamp) {
    if (!this.loaded) {
      return {
        hands: null,
        faces: null
      };
    }

    const hands =
      this.handLandmarker.detectForVideo(
        video,
        timestamp
      );

    const faces =
      this.faceLandmarker.detectForVideo(
        video,
        timestamp
      );

    return {
      hands,
      faces
    };
  }

  getHandInteraction(results, rect) {
    const landmarks =
      results?.hands?.landmarks?.[0];

    if (!landmarks) {
      return null;
    }

    const indexTip = landmarks[8];
    const indexMcp = landmarks[5];
    const thumbTip = landmarks[4];

    if (!indexTip || !indexMcp) {
      return null;
    }

    /*
      Mirror X because the webcam is displayed mirrored.
    */

    const x =
      (1 - indexTip.x) *
      rect.width;

    const y =
      indexTip.y *
      rect.height;

    const previousX =
      (1 - indexMcp.x) *
      rect.width;

    const previousY =
      indexMcp.y *
      rect.height;

    let dx = x - previousX;
    let dy = y - previousY;

    const length =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    if (length > 0.001) {
      dx /= length;
      dy /= length;
    } else {
      dx = 1;
      dy = 0;
    }

    return {
      indexTip: {
        x,
        y
      },

      thumbTip: thumbTip
        ? {
            x:
              (1 - thumbTip.x) *
              rect.width,

            y:
              thumbTip.y *
              rect.height
          }
        : null,

      direction: {
        x: dx,
        y: dy
      }
    };
  }

  getFaceInteraction(results, rect) {
    const landmarks =
      results?.faces?.faceLandmarks?.[0];

    if (!landmarks) {
      return null;
    }

    /*
      MediaPipe face landmarks:
      13 = upper lip
      14 = lower lip
    */

    const upperLip =
      landmarks[13];

    const lowerLip =
      landmarks[14];

    if (!upperLip || !lowerLip) {
      return null;
    }

    const mouthX =
      (upperLip.x + lowerLip.x) / 2;

    const mouthY =
      (upperLip.y + lowerLip.y) / 2;

    const mouthCenter = {
      x:
        (1 - mouthX) *
        rect.width,

      y:
        mouthY *
        rect.height
    };

    const mouthOpening =
      Math.abs(
        lowerLip.y -
        upperLip.y
      ) *
      rect.height;

    return {
      mouthCenter,
      mouthOpening
    };
  }
}
