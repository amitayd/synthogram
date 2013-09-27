function init() {
  //return;

  var defaultStepDuration = 100;


  $("#oscillatorType").buttonset();
  $("#drawingTool").buttonset();
  $('#clearCanvas').button();
  $('#pauseToggle').button();

  var isSelectorClicked = false;
  var stepSelector = $('#stepSelector');
  stepSelector[0].addEventListener('mousedown', function(e) {
    isSelectorClicked = true;
    sequencer.jumpToStep(e.pageX - stepSelector.offset().left);
  }, false);

  stepSelector[0].addEventListener('mouseup', function(e) {
    isSelectorClicked = false;
  }, false);

  stepSelector[0].addEventListener('mousemove', function(e) {
    if (isSelectorClicked) {
      sequencer.jumpToStep(e.pageX - stepSelector.offset().left);
    }
  }, false);


  $('#stepDurationSlider').slider({
    min: 1,
    max: 400,
    value: 100,
    orientation: 'vertical',
    change: function(event, ui) {
      $("#stepDuration").val(ui.value);
      $("#stepDuration").trigger("change");
    }
  });
  $('#stepDuration').bind('change', function() {
    console.log(1 / $(this).val());
    sequencer.config.stepDuration = 1 / $(this).val() * 1000;
  })
  $('#stepDuration').val(defaultStepDuration);


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


  var bindInputToProperty = function(obj, property) {
    console.log(property);

    function bind() {
      console.log("changing");
      obj[property] = parseInt(document.getElementById(property).value);
    }

    bind();
    document.getElementById(property).addEventListener('change', bind, false);
  }

  $('#wPaint').wPaint({
    path: 'js/wpaint/',
    menuOffsetLeft: 0, // left offset of primary menu
    menuOffsetTop: -45,
    lineWidth: '1', // starting line width
    fillStyle: '#FFFFFF', // starting fill style
    strokeStyle: '#000000', // start stroke style    
    menuHandle: false,
  });


  var freqHerz = $('#freqHertz');
  var wPaintCanvas = $('.wPaint-canvas');
  wPaintCanvas.bind('mousemove', function(e) {
    var y = e.pageY - wPaintCanvas.offset().top;
    var oscNum = source.getOscillatorForY(y);
    var oscData = synth.getOscillatorData(oscNum);
    freqHerz.text(Math.round(oscData.frequency).toFixed(1));
  }).bind("mouseout", function() {
    freqHerz.text('--')
  });



  var numOscillators = 80;
  var startFrequency = 55;
  //var startFrequency = 440;
  var source = CanvasSource(wPaintCanvas[0], 'overlay', numOscillators);
  var synth = OscSynth(numOscillators, startFrequency);
  var sequencer = Sequencer(synth, source, defaultStepDuration);



  sequencer.start();



  document.getElementById('pauseToggle').addEventListener('click', sequencer.pauseToggle, false);
  document.getElementById('oscillatorType').addEventListener('change', function() {
    var option = $('input:checked', '#oscillatorType')[0].id;
    synth.setOscillatorsType(option);
  }, false);
}

window.addEventListener('load', init, false);