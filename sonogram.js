var context;


function StepSynth(source) {

  // Create Web Audio Context.
  var context = new webkitAudioContext();
  var compressor = context.createDynamicsCompressor();
  compressor.connect(context.destination);
  var oscillators = [];
  var currStep = 0;
  var isPlaying = false;
  var isMuted = false;


  var init = function() {
    console.log("initializing");
    for (var i = 0; i < source.numOscillators; i++) {
      var frequency = getFrequency(i);
      oscillators.push(createOscillator(frequency));
    }
    playSteps();
  }

  var createOscillator = function(frequency) {
    // Create oscillator and gain node.
    var oscillator = context.createOscillator(),
      gainNode = context.createGainNode();

    // Set the type and frequency of the oscillator.
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    // Set volume of the oscillator.
    gainNode.gain.value = 0;

    // Route oscillator through gain node to speakers.
    oscillator.connect(gainNode);
    gainNode.connect(compressor);

    // Start oscillator playing.
    oscillator.start(0); // This will be replaced by start() soon.

    return {
      oscillator: oscillator,
      gain: gainNode.gain
    };
  };

  // TODO: use ENUM

  function setOscillatorsType(oscillatorType) {
    console.log("setOscillatorsType", oscillatorType)
    for (var i = 0; i < oscillators.length; i++) {
      var osc = oscillators[i].oscillator;
      osc.type = oscillatorType;
    }
  };


  function start() {
    isPlaying = true;
  };

  function getFrequency(n) {
    // http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
    var f0 = 440;
    var a = Math.pow(2, 1 / 12.0);
    return f0 * Math.pow(a, n);
  }

  function mute() {
    console.log('stopping');

    isMuted = !isMuted;
    if (isMuted) {
      for (var i = 0; i < oscillators.length; i++) {
        oscillators[i].gain.value = 0;
      }
    }

  }

  function pause() {
    console.log('pausing/resuming');
    isPlaying = !isPlaying;
  }

  var playSteps = function() {
    console.log('playSteps');

    function loop() {
      var step = source.getStep(currStep);
      if (!isMuted) {
        for (var i = 0; i < oscillators.length; i++) {
          oscillators[i].gain.value = step[i];
        }
      }

      if (isPlaying) {
        currStep = (currStep + 1) % source.numSteps;
      }
      window.setTimeout(loop, source.stepDuration);

    }

    loop();
  }

  init();

  return {
    mute: mute,
    pause: pause,
    setOscillatorsType: setOscillatorsType
  }
}


function CanvasSource(elementId, overlayId) {
  var canvas = document.getElementById(elementId);
  var context = canvas.getContext('2d');
  var overlayContext = document.getElementById(overlayId).getContext('2d');
  var numOscillators = canvas.height;
  var numSteps = canvas.width;

  var markStep = function(stepIndex) {
    overlayContext.clearRect(0, 0, canvas.width, canvas.height);
    overlayContext.beginPath();
    overlayContext.moveTo(stepIndex, 0);
    overlayContext.lineTo(stepIndex, canvas.height);
    overlayContext.stroke();
  }

  return {
    getStep: function(stepIndex) {
      var imageData = context.getImageData(stepIndex, 0, 1, canvas.height);
      var data = imageData.data;

      step = [];
      for (var y = 0; y < numOscillators; y++) {
        // var red = data[(numSteps * y) * 4];
        // var green = data[(numSteps * y) * 4 + 1];
        // var blue = data[(numSteps * y) * 4 + 2];
        var alpha = data[(y) * 4 + 3];
        step.push(alpha / 256);
      }

      markStep(stepIndex);
      return step;
    },
    numOscillators: numOscillators,
    numSteps: numSteps,
    stepDuration: 100
  }

}