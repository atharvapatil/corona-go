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
  model = await tmPose.load(modelURL, metadataURL);
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const size = 200;
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(thisloop);

  // append/get elements to the DOM
  const canvas = document.getElementById("canvas");
  canvas.width = size;
  canvas.height = size;
  ctx = canvas.getContext("2d");
  canvas.style.display = 'none';
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

  if (pose) {

    document.getElementById('loading-wrapper').style.display = 'none';
    document.getElementById('status-wrapper').style.display = 'block';

    let neutral_probablity = prediction[0].probability;
    let left_probablity = prediction[1].probability;
    let right_probablity = prediction[2].probability;

    let topResult = await largestNumber(neutral_probablity, left_probablity, right_probablity);


    const goodResultSpan =  document.getElementById('result-good');
    const badResultSpan =  document.getElementById('result-bad');

      if (topResult == 'Nice! Keep those hand away') {
        goodResultSpan.textContent = topResult;
        goodResultSpan.style.background = '#a5d6a7';
        goodResultSpan.style.color = 'black';
        badResultSpan.style.background = '#e0e0e0';
        badResultSpan.style.color = '#616161';
        feedbackSound.stop();
      } else if (topResult == 'Stop touching your face!' && !feedbackSound.isPlaying()) {
        badResultSpan.textContent = topResult;
        badResultSpan.style.background = '#e57373';
        badResultSpan.style.color = 'black';
        goodResultSpan.style.background = '#e0e0e0';
        goodResultSpan.style.color = '#616161';
        feedbackSound.play();
      }

  }

}

function largestNumber(one, two, three) {

  let neutral = 'Nice! Keep those hand away';
  let left = 'Stop touching your face!';
  let right = 'Stop touching your face!';

  if (one > two && one > three) {
    return neutral
  } else if (two > one && two > three) {
    return left
  } else if (three > one && three > one) {
    return right
  };

}
