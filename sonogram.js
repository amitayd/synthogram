var context;


function StepSynth() {

  // Create Web Audio Context.
  var context = new webkitAudioContext();
  var compressor = context.createDynamicsCompressor();
  compressor.connect(context.destination);
  var oscillators = [];
  var currStep = 0;
  var isPlaying = false;
  var isInitialized = false;
  var steps = [];
  var stepDuration = 200;

  function start(newSteps, newStepDuration) {
    steps = newSteps;
    stepDuration = newStepDuration;
    console.log('start');
    var createOscillator = function(frequency) {
      // Create oscillator and gain node.
      var oscillator = context.createOscillator(),
        gainNode = context.createGainNode();

      // Set the type and frequency of the oscillator.
      oscillator.type = oscillator.SQUARE;
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
    }


    if (!isInitialized) {
      console.log("initializing");
      for (var i = 0; i < steps[0].length; i++) {
        // TODO: add some normal frequency scale
        var frequency = getFrequency(i);
        oscillators.push(createOscillator(frequency));
      }
    }
    isInitialized = true;
    if (!isPlaying) {
      isPlaying = true;
      playSteps(steps, stepDuration);
    }
  }

  function getFrequency(n) {
    // http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
    var f0 = 440;
    var a = Math.pow(2, 1 / 12.0);
    return f0 * Math.pow(a, n);
  }

  function stop() {
    for (var i = 0; i < oscillators.length; i++) {
      oscillators[i].gain.value = 0;
    }
    isPlaying = false;
  }

  var playSteps = function() {
    console.log('playSteps');

    function loop() {
      for (var i = 0; i < oscillators.length; i++) {
        if (!isPlaying) return;

        oscillators[i].gain.value = steps[currStep][i];
      }

      currStep = (currStep + 1) % steps.length;
      window.setTimeout(loop, stepDuration);

    }

    loop();
  }

  return {
    start: start,
    stop: stop
  }
}