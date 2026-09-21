export class CameraController {

  constructor(video) {

    this.video =
      video;

    this.stream =
      null;
  }


  async start() {

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


    this.video.srcObject =
      this.stream;


    await this.video.play();
  }


  stop() {

    this.stream
      ?.getTracks()
      .forEach(
        track => track.stop()
      );

    this.stream =
      null;
  }

}
