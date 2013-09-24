function init() {
  addPainter();

  var bindInputToProperty = function(obj, property) {
    function bind() {
      obj[property] = parseInt(document.getElementById(property).value);
    }

    bind();
    document.getElementById(property).addEventListener('change', bind, false);
  }

  var numOscillators = 80;
  var source = CanvasSource('imageView', 'overlay', numOscillators);
  bindInputToProperty(source, 'stepDuration')
  source.stepDuration = parseInt(document.getElementById('stepDuration').value);
  synth = StepSynth(source);

  // var numSteps = 500;
  // var numOscillators = 50;


  // var steps = [];
  // for (var stepIndex = 0; stepIndex < numSteps; stepIndex++) {
  //   var step = [];
  //   steps.push(step);
  //   for (var oscillatorIndex = 0; oscillatorIndex < numOscillators; oscillatorIndex++) {
  //     step.push(Math.random());
  //   }
  // }

  document.getElementById('clearCanvas').addEventListener('click', clearCanvas, false);

  document.getElementById('pause').addEventListener('click', synth.pause, false);
  document.getElementById('mute').addEventListener('click', synth.mute, false);
  document.getElementById('oscillatorType').addEventListener('change', function() {
    var el = document.getElementById('oscillatorType');
    var option = el.options[el.selectedIndex].text;
    synth.setOscillatorsType(option);
  }, false);
}

window.addEventListener('load', init, false);