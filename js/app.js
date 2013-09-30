function init() {

  var sonoModel = new Model({
    stepDuration: 100,
    volume: 0.5,
    numOscillators: 80,
    startFrequency: 55,
    delayTime: 0.125,
    delayFeedbackGain: 0.25,
    delayWetGain: 0.3,
    startNote: 'C',
    startOctave: 2,
    musicalScale: 'major',
    numOctaves: 6
  });


  $("#oscillatorType").buttonset();
  $("#drawingTool").buttonset();
  $('#clearCanvas').button();
  $('#pauseToggle').button();
  $('#save').button();
  $('#saveNew').button();

  var createLabel = function(element) {
    var label = $("<label class='controlLabel' />")
    label.attr({
      for: element.attr('id'),
      title: element.attr('title')
    });
    label.text(element.attr('data-label'));
    element.before(label);

    label.tooltip();
  };


  var bindInputToProperty = function(selector, propName, isInteger, values, label) {
    var element = $(selector);
    if (values) {
      $.each(values, function(key, value) {
        element
          .append($("<option></option>")
            .attr("value", value)
            .text(value));
      });
    }
    element.val(sonoModel.getVal(propName));
    element.bind('change', function() {
      var value = element.val();
      if (isInteger) {
        value = parseInt(value);
      }
      sonoModel.get(propName).set(value);
    });

    createLabel(element);
  };

  var getKeys = function(obj) {
    function SortByName(a, b) {
      return ((a < b) ? -1 : ((a > b) ? 1 : 0));
    }

    return $.map(obj, function(element, index) {
      return index
    }).sort(SortByName);
  };

  var musicalScales = getKeys(MUSIC.scales);
  musicalScales.push('quarter notes');

  bindInputToProperty('#startNote', 'startNote', false, getKeys(MUSIC.notes));
  bindInputToProperty('#startOctave', 'startOctave', true, [0, 1, 2, 3, 4, 5, 6, 7]);
  bindInputToProperty('#musicalScale', 'musicalScale', false, musicalScales);
  bindInputToProperty('#numOctaves', 'numOctaves', true, [1, 2, 3, 4, 5, 6]);

  var isSelectorClicked = false;
  var stepSelector = $('#stepSelector');
  stepSelector.bind('mousedown', function(e) {
    isSelectorClicked = true;
    sequencer.jumpToStep(e.pageX - stepSelector.offset().left);
  });

  stepSelector.bind('mouseup', function(e) {
    isSelectorClicked = false;
  });

  stepSelector.bind('mousemove', function(e) {
    if (isSelectorClicked) {
      sequencer.jumpToStep(e.pageX - stepSelector.offset().left);
    }
  });

  stepSelector.bindMobileEvents();



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
    sonoModel.get('stepDuration').set(1 / $(this).val() * 1000);
  })
  $('#stepDuration').val(sonoModel.getVal('stepDuration'));
  $('#stepDuration').bindMobileEvents();


  var createKnob = function(property, min, max, scale, step) {
    var scale = scale || 1;
    var step = step || 1;
    var id = 'knb_' + property.name;
    var element = $('#' + id);
    element.tooltip();


    createLabel(element)
    element.bind('change', function() {
      property.set(parseInt(element.val()) / scale);
    });
    element.val(property.get() * scale);
    element.knob({
      width: 50,
      height: 50,
      step: step,
      min: min,
      max: max,
      fgColor: 'black',
      change: function(val) {
        // fix for the even returning values not rounded
        var valRounded = Math.floor(val - (val % step)) / scale;
        property.set(valRounded);;
      }
    });
  }

  createKnob(sonoModel.get('volume'), 0, 100, 100, 5);
  createKnob(sonoModel.get('delayTime'), 0, 1000, 1000, 10);
  createKnob(sonoModel.get('delayFeedbackGain'), 0, 100, 100, 5);
  createKnob(sonoModel.get('delayWetGain'), 0, 100, 100, 5);


  // override some wPaint settings
  $.fn.wPaint.menus.text.items.fontSize.range = [8, 9, 10, 12, 14, 16, 20, 24, 30, 40, 50, 60];
  $('#wPaint').wPaint({
    path: 'lib/wpaint/',
    menuOffsetLeft: 0, // left offset of primary menu
    menuOffsetTop: -45,
    lineWidth: '1', // starting line width
    fillStyle: '#FFFFFF', // starting fill style
    strokeStyle: '#000000', // start stroke style    
    menuHandle: false,
  });


  var freqHerz = $('#freqHertz');
  var freqName = $('#freqName');
  var wPaintCanvas = $('.wPaint-canvas');
  wPaintCanvas.bind('mousemove', function(e) {
    var y = e.pageY - wPaintCanvas.offset().top;
    var oscNum = source.getOscillatorForY(y);
    var oscData = synth.getOscillatorData(oscNum);
    freqHerz.text(oscData.frequency.toFixed(2));
    freqName.text(oscData.name);
  }).bind("mouseout", function() {
    freqHerz.text('--')
  });




  var source = CanvasSource(wPaintCanvas[0], 'overlay',
    sonoModel.get('numOscillators')
  );
  var synth = OscSynth(
    sonoModel.get('numOscillators'),
    sonoModel.get('startNote'),
    sonoModel.get('startOctave'),
    sonoModel.get('musicalScale'),
    sonoModel.get('numOctaves'),
    sonoModel.get('volume'),
    sonoModel.get('delayTime'),
    sonoModel.get('delayFeedbackGain'),
    sonoModel.get('delayWetGain')
  );

  var sequencer = Sequencer(synth, source,
    sonoModel.get('stepDuration')
  );

  sequencer.start();

  var getRandomKey = function() {
    var r6 = function() {
      return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1)
    };
    return r6() + r6();
  };

  document.getElementById('pauseToggle').addEventListener('click', sequencer.pauseToggle, false);

  // TODO: move firebase part to load Async
  try {
    var imagesDataRef = new Firebase('https://sonogram.firebaseio.com/images');
  } catch (e) {

  }


  var saveImage = function(key) {
    var img = $("#wPaint").wPaint("image");
    var navJson = JSON.stringify({
      imageKey: key
    });
    console.log("Saving", navJson, img);

    imagesDataRef.child(key).set(img, function() {
      console.log('saved', arguments);
    });
    window.location.hash = encodeURIComponent(navJson);
  }

  document.getElementById('saveNew').addEventListener('click', function() {
    var key = getRandomKey();
    saveImage(key);
  }, false);


  document.getElementById('save').addEventListener('click', function() {
    var key = getHashParameters().imageKey;
    saveImage(key);
  }, false);

  var getHashParameters = function() {
    var hash = window.location.hash;
    if (hash.length > 2) {
      var navJson = JSON.parse(decodeURIComponent(hash.substring(1)));
      return navJson;
    } else {
      return {
        imageKey: getRandomKey()
      };
    }
  };

  var loadFromHash = function() {
    //http://192.168.2.109:8000/sonogram.html#%7B%22imgKey%22%3A%22sonogram_image_abb14b488e7b%22%7D
    var hash = window.location.hash;
    if (hash.length > 2) {
      var navJson = JSON.parse(decodeURIComponent(hash.substring(1)));
      console.log('navigating', navJson);

      imagesDataRef.child(navJson.imageKey).on('value', function(data) {
        console.log('loaded', data.val());
        $('#wPaint').wPaint('image', data.val());
      });
    }
  };

  window.onhashchange = loadFromHash;
  loadFromHash();

  document.getElementById('oscillatorType').addEventListener('change', function() {
    var option = $('input:checked', '#oscillatorType')[0].id;
    synth.setOscillatorsType(option);
  }, false);
}

window.addEventListener('load', init, false);