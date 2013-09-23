function init() {
  addPainter();
  synth = StepSynth();

  var numSteps = 500;
  var numOscillators = 50;


  var steps = [];
  for (var stepIndex = 0; stepIndex < numSteps; stepIndex++) {
    var step = [];
    steps.push(step);
    for (var oscillatorIndex = 0; oscillatorIndex < numOscillators; oscillatorIndex++) {
      step.push(Math.random());
    }
  }

  // var steps = [
  //   [0, 0, 1, 0.5, 0.2],
  //   [1, 0, 0.2, 0.5, 0.3],
  //   [0.2, 0, 0.2, 0.5, 0.3],
  // ];
  var duration = 10;
  //synth.start(steps, duration);
  //window.setTimeout(synth.stop, 20000);

  document.getElementById('start').addEventListener('click', function() {
    synth.start(getCanvasContent(50, 50), duration);
  }, false);

  document.getElementById('stop').addEventListener('click', function() {
    synth.stop();
  }, false);

}

window.addEventListener('load', init, false);