export class CameraController {
  constructor(video) {
    this.video = video;
    this.stream = null;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error(
        "Camera access is not available in this browser."
      );
    }

    this.stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        },
        audio: false
      });

    this.video.srcObject = this.stream;

    await this.video.play();
  }

  stop() {
    if (this.stream) {
      this.stream
        .getTracks()
        .forEach((track) => track.stop());
    }

    this.stream = null;
    this.video.srcObject = null;
  }
}
