/*exported  Sequencer */
'use strict';

function Sequencer(synth, source, stepsPerSecond, currentStep) {

  var numSteps = source.numSteps;
  var isPlaying = false;
  var isStarted = false;


  var playAndIncrement = function() {
    var step = currentStep.get();
    if (isPlaying) {
      step = (step + 1) % numSteps;
    }
    playStep(step);

  };

  var playStep = function(newStep) {
    newStep = parseInt(newStep, 10);
    var step = source.getStep(currentStep.get());
    //console.log(step);
    synth.play(step);
    currentStep.set(newStep);
  };

  var start = function() {
    console.log('seq.play');
    if (isStarted) {
      return;
    }

    isStarted = true;

    function loop() {
      playAndIncrement();
      setTimeout(loop, 1000 / stepsPerSecond.get());
    }

    loop();
  };

  var setIsPlaying = function(isPlayingParam) {
    isPlaying = isPlayingParam;
    console.log('pauseToggle', isPlaying);
  };

  currentStep.addChangeListener(playStep);

  return {
    start: start,
    setIsPlaying: setIsPlaying,
    isPlaying: function() {
      return isPlaying;
    }
  };
}