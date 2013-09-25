function init() {

  $("#oscillatorType").buttonset();
  $("#drawingTool").buttonset();
  $('#clearCanvas').button();
  $("#masterVolume").knob({
    width: 50,
    height: 50,
    fgColor: 'black',
    change: function(v) {
      synth.masterGain.value = (v / 100);
    }
  });

  $("#compressorRatio").knob({
    width: 50,
    height: 50,
    min: -100,
    max: 0,
    fgColor: 'red',
    change: function(v) {
      synth.compressor.ratio.value = (v);
    }
  });

  $("#compressorReduction").knob({
    width: 50,
    height: 50,
    min: -20,
    max: 0,
    fgColor: 'red',
    change: function(v) {
      synth.compressor.reduction.value = (v);
    }
  });

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
  var synth = OscSynth(numOscillators);
  var sequencer = Sequencer(synth, source, 200);

  bindInputToProperty(sequencer.config, 'stepDuration')

  sequencer.start();

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

  document.getElementById('pause').addEventListener('click', sequencer.pauseToggle, false);
  document.getElementById('oscillatorType').addEventListener('change', function() {
    var option = $('input:checked', '#oscillatorType')[0].id;
    synth.setOscillatorsType(option);
  }, false);
}

window.addEventListener('load', init, false);