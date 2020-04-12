const URL = "https://teachablemachine.withgoogle.com/models/-eJSOoeR/"; // model url
let model, webcam, ctx, labelContainer, maxPredictions; //teachable machine variables

// audio feedback variables
let feedbackSound;
let playMode = 'restart';

// Setup function from p5 reference does the job of onload
// window.addEventListener('DOMContentLoaded', () => {});
function setup() {
  feedbackSound = loadSound('./assets/moon.mp3');
  console.log('song loaded');
  // init();
}
// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

async function init() {
  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  document.getElementById('cta-wrapper').style.display = 'none';
  document.getElementById('loading-wrapper').style.display = 'block';

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const size = 200;
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  // await webcam.pause();
  window.requestAnimationFrame(thisloop);

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = size;
  canvas.height = size;
  ctx = canvas.getContext("2d");
  canvas.style.display = 'none';
  // labelContainer = document.getElementById("label-container");
  // for (let i = 0; i < maxPredictions; i++) { // and class labels
  //   labelContainer.appendChild(document.createElement("div"));
  // }
}

async function thisloop(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(thisloop);
}

async function predict() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const {
    pose,
    posenetOutput
  } = await model.estimatePose(webcam.canvas);
  // Prediction 2: run input through teachable machine classification model
  const prediction = await model.predict(posenetOutput);

  // for (let i = 0; i < maxPredictions; i++) {
  //   const classPrediction =
  //     prediction[i].className + ": " + prediction[i].probability.toFixed(2);
  //   labelContainer.childNodes[i].innerHTML = classPrediction;
  // }

  if (pose) {

    document.getElementById('loading-wrapper').style.display = 'none';
    document.getElementById('status-wrapper').style.display = 'block';

    let neutral_probablity = prediction[0].probability;
    let left_probablity = prediction[1].probability;
    let right_probablity = prediction[2].probability;

    let topResult = await largestNumber(neutral_probablity, left_probablity, right_probablity);

    document.getElementById('result').textContent = topResult;

      if (topResult == 'Acchi baat no corona') {
        // .isPlaying() returns a boolean
        // song.playMode('sustain');
        feedbackSound.stop();
      } else if (topResult == 'Ohh you have corona now' && !feedbackSound.isPlaying()) {
        // song.playMode('sustain');
        feedbackSound.play();
      }

  }


}

function largestNumber(one, two, three) {

  let neutral = 'Acchi baat no corona';
  let left = 'Ohh you have corona now';
  let right = 'Ohh you have corona now';

  if (one > two && one > three) {
    return neutral
  } else if (two > one && two > three) {
    return left
  } else if (three > one && three > one) {
    return right
  };

}




function drawPose(pose) {
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }
}
