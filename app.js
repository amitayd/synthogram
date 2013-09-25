function init() {

  var defaultStepDuration = 100;


  $("#oscillatorType").buttonset();
  $("#drawingTool").buttonset();
  $('#clearCanvas').button();
  $('#pauseToggle').button();


  var isSelectorClicked = false;
  $('#stepSelector').bind('mousedown', function(e) {
    isSelectorClicked = true;
    sequencer.jumpToStep(e.pageX - $('#stepSelector').offset().left);
  }).bind('mouseup', function(e) {
    isSelectorClicked = false;
  }).bind('mousemove', function(e) {
    if (isSelectorClicked) {
      sequencer.jumpToStep(e.pageX - $('#stepSelector').offset().left);
    }
  });

  $('#stepDurationSlider').slider({
    min: 10,
    max: 400,
    value: painterConfig.lineWidth,
    change: function(event, ui) {
      $("#stepDuration").val(ui.value);
      $("#stepDuration").trigger("change");
    }
  });
  $('#stepDuration').bind('change', function() {
    sequencer.config.stepDuration = $(this).val();
  })
  $('#stepDuration').val(defaultStepDuration);

  $('#lineWidthSlider').slider({
    min: 1,
    max: 10,
    value: 1,
    change: function(event, ui) {
      $("#lineWidth").val(ui.value);
      painterConfig.lineWidth = ui.value;
    }
  });

  $('#alphaSlider').slider({
    min: 0,
    max: 1,
    step: 0.01,
    value: 1,
    change: function(event, ui) {
      $("#alpha").val(ui.value);
      painterConfig.alpha = ui.value;
    }
  });

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
    console.log(property);

    function bind() {
      console.log("changing");
      obj[property] = parseInt(document.getElementById(property).value);
    }

    bind();
    document.getElementById(property).addEventListener('change', bind, false);
  }

  var numOscillators = 80;
  var source = CanvasSource('imageView', 'overlay', numOscillators);
  var synth = OscSynth(numOscillators);
  var sequencer = Sequencer(synth, source, defaultStepDuration);

  //bindInputToProperty(sequencer.config, 'stepDuration');



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

  document.getElementById('pauseToggle').addEventListener('click', sequencer.pauseToggle, false);
  document.getElementById('oscillatorType').addEventListener('change', function() {
    var option = $('input:checked', '#oscillatorType')[0].id;
    synth.setOscillatorsType(option);
  }, false);
}

window.addEventListener('load', init, false);