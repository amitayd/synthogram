/*exported  synthogram_init */
/*globals  Muscula */

function synthogram_init() {

  // MODEL CREATION

  $.fn._button = $.fn.button.noConflict();
  $.fn._tooltip = $.fn.tooltip.noConflict();
  var sonoModel = new Model({
    stepDuration: 33.33,
    volume: 0.5,
    numOscillators: 80,
    startFrequency: 55,
    delayTime: 0.125,
    delayFeedbackGain: 0.25,
    delayWetGain: 0.3,
    startNote: 'C',
    startOctave: 4,
    musicalScale: 'major',
    numOctaves: 2,
    waveShape: 'sine',
    isPlaying: false,
    isSynthPlaying: false,
  });


  var getKeys = function(obj) {
    return $.map(obj, function(element, index) {
      return index;
    }).sort();
  };

  var musicalScales = getKeys(MUSIC.scales);
  musicalScales.push('quarter notes');


  // END MODEL CREATION


  // SET UP UI

  $("#oscillatorType").buttonset();
  $("#drawingTool").buttonset();
  $('#pause').button({
    icons: {
      primary: "ui-icon-pause"
    }
  });
  $('#stopPlayToggle').button({
    icons: {
      primary: "ui-icon-play"
    }
  });
  $('#stopPlayToggle').tooltip({
    position: {
      my: "left+15 center",
      at: "top"
    }
  });
  $('#mute').button({
    icons: {
      primary: "ui-icon-cancel"
    }
  });
  $('#volumeUp').button({
    icons: {
      primary: "ui-icon-volume-on"
    }
  });
  $('#volumeDown').button({
    icons: {
      primary: "ui-icon-volume-off"
    }
  });
  $('#save').button();
  $('#saveNew').button();

  $('#startNote').sgDropdown(sonoModel.get('startNote'), getKeys(MUSIC.notes));
  $('#startOctave').sgDropdown(sonoModel.get('startOctave'), [0, 1, 2, 3, 4, 5, 6, 7]);
  $('#musicalScale').sgDropdown(sonoModel.get('musicalScale'), musicalScales);
  $('#numOctaves').sgDropdown(sonoModel.get('numOctaves'), [1, 2, 3, 4, 5, 6]);


  $('#volumeUp').on('mousedown', function() {
    var value = Math.min(1, sonoModel.getVal('volume') + 0.05);
    sonoModel.get('volume').set(value);
  });

  $('#volumeDown').on('mousedown', function() {
    sonoModel.get('volume').set(Math.max(0, sonoModel.getVal('volume') - 0.05));
  });

  sonoModel.get('volume').addChangeListener(function(value) {
    $('#volumeValue').text(Math.floor(value * 100));
  });
  $('#volumeValue').text(sonoModel.getVal('volume') * 100);

  var isSelectorClicked = false;
  var stepSelector = $('#stepSelector');
  stepSelector.bindMobileEvents();

  $('#stepDuration').sgStepDurationSlider(sonoModel.get('stepDuration'));

  //$('#knb_volume').sgKnob(sonoModel.get('volume'), 0, 100, 100, 5);
  $('#knb_delayTime').sgKnob(sonoModel.get('delayTime'), 0, 1000, 1000, 5);
  $('#knb_delayFeedbackGain').sgKnob(sonoModel.get('delayFeedbackGain'), 0, 100, 100, 5);
  $('#knb_delayWetGain').sgKnob(sonoModel.get('delayWetGain'), 0, 100, 100, 5);


  // override some wPaint settings
  $.fn.wPaint.menus.text.items.fontSize.range = [8, 9, 10, 12, 14, 16, 20, 24, 30, 40, 50, 60];
  $('#wPaint').wPaint({
    path: 'lib/wpaint/',
    menuOffsetLeft: -20, // left offset of primary menu
    menuOffsetTop: -45,
    lineWidth: '4', // starting line width
    fillStyle: '#0000FF', // starting fill style
    strokeStyle: '#000000', // start stroke style    
    menuHandle: false,
  });


  var getOscDataForY = function(y) {
    if (typeof synth === 'undefined') {
      return {
        name: '--',
        frequency: 0
      };
    }
    var oscNum = source.getOscillatorForY(y);
    var oscData = synth.getOscillatorData(oscNum);
    return oscData;
  };

  var freqHerz = $('#freqHertz');
  var freqName = $('#freqName');
  var wPaintCanvas = $('.wPaint-canvas');
  wPaintCanvas.bind('mousemove', function(e) {
    var y = e.pageY - wPaintCanvas.offset().top;
    if (y >= wPaintCanvas.height() || y < 0) {
      return;
    }
    var oscData = getOscDataForY(y);
    freqHerz.text(oscData.frequency.toFixed(2));
    freqName.text(oscData.name);
  }).bind("mouseout", function() {
    freqHerz.text('--');
    freqName.text('--');
  });

  var source = CanvasSource(wPaintCanvas[0], 'overlay',
    sonoModel.get('numOscillators')
  );

  $('.transparentOverlay').on('touchstart touchmove touchend touchcancel', function() {
    return false;
  });


  var drawGrid = function() {
    var xStep = 10;
    var yStep = Number($('#overlayGrid').attr('height')) / sonoModel.getVal('numOscillators');
    var legendFunc = function(y) {
      var oscData = getOscDataForY(y);
      return oscData.name;
    };

    console.log('drawing grid', xStep, yStep);
    $('#overlayGrid').sgGrid(xStep, yStep);
    $('#gridLabels').sgGridLabels(yStep, legendFunc);
    $('#wPaint').wPaint('snapGridVertical', yStep);
    $('#wPaint').wPaint('snapGridHorizontal', xStep);

  };


  $('#oscillatorType').on('change', function() {
    var option = $('input:checked', '#oscillatorType')[0].id;
    sonoModel.get('waveShape').set(option);
  });

  sonoModel.get('waveShape').addChangeListener(function(value) {
    // Check the correct button on change
    $('#' + value).attr("checked", "checked").button('refresh');
  });

  $('#mute').on('click', function() {
    var volumeValue = 0;
    // Unmute if needed
    if (sonoModel.getVal('volume') === 0) {
      // TODO: yuck
      volumeValue = 0.5;
    }
    sonoModel.get('volume').set(volumeValue);
  });

  sonoModel.get('volume').addChangeListener(function(value) {
    $('#mute').button('option', 'icons', {
      primary: value === 0 ? 'ui-icon-radio-off' : 'ui-icon-cancel'
    });
  });

  $('#pause').on('click', function() {
    sonoModel.get('isPlaying').set(!sonoModel.getVal('isPlaying'));
  });

  $('#stopPlayToggle').on('click', function() {
    var isSynthPlaying = !sonoModel.getVal('isSynthPlaying');
    sonoModel.get('isSynthPlaying').set(isSynthPlaying);
    sonoModel.get('isPlaying').set(isSynthPlaying);
  });

  sonoModel.get('isSynthPlaying').addChangeListener(function() {
    var isSynthPlaying = sonoModel.getVal('isSynthPlaying');
    $('#stopPlayToggle').button('option', 'icons', {
      primary: isSynthPlaying ? 'ui-icon-stop' : ' ui-icon-play'
    });
  });

  $('body').on('keydown', function(e) {
    console.log('keydown', e.keyCode);
    if (e.keyCode === 32) { //spacebar
      $('#stopPlayToggle').trigger('click');
    }

  });



  //END SETUP UI


  // START COMPONENETS

  if (typeof AudioContext === 'undefined') {
    // No Audio Context - show error
    if (typeof Muscula !== 'undefined') {
      Muscula.errors.push(new Error('Browser not supported for Synthogram'));
    }
    $("#notSupportedModal").dialog({
      height: 200,
      width: 350,
      modal: true
    });
    return;
  }

  var synth = OscSynth(
    sonoModel.get('numOscillators'),
    sonoModel.get('startNote'),
    sonoModel.get('startOctave'),
    sonoModel.get('musicalScale'),
    sonoModel.get('numOctaves'),
    sonoModel.get('volume'),
    sonoModel.get('delayTime'),
    sonoModel.get('delayFeedbackGain'),
    sonoModel.get('delayWetGain'),
    sonoModel.get('waveShape'),
    sonoModel.get('isSynthPlaying')
  );

  var sequencer = Sequencer(synth, source,
    sonoModel.get('stepDuration')
  );

  sonoModel.get('isPlaying').addChangeListener(function(value) {
    sequencer.setIsPlaying(value);
  });

  sequencer.start();

  // TODO: move firebase part to load Async
  try {
    var imagesDataRef = new Firebase('https://sonogram.firebaseio.com/images');
  } catch (e) {

  }

  var loadRoute = '#load/';

  var saveImage = function(key) {
    var getRandomKey = function() {
      var r6 = function() {
        return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
      };
      return r6() + r6();
    };
    key = key || getRandomKey();
    var img = $("#wPaint").wPaint("image");

    var settingsToSave = [
      'stepDuration',
      'startFrequency',
      'delayTime',
      'delayFeedbackGain',
      'delayWetGain',
      'startNote',
      'startOctave',
      'musicalScale',
      'numOctaves',
      'waveShape',
    ];

    var saveData = {
      img: img,
      settings: {},
      saveDate: new Date().toISOString()
    };

    $.each(settingsToSave, function(index, settingKey) {
      saveData.settings[settingKey] = sonoModel.getVal(settingKey);
    });


    imagesDataRef.child(key).set(saveData, function() {
      console.log('saved', saveData);
      window.location.hash = loadRoute + key;
    });
  };

  $('#saveNew').on('click', function() {
    saveImage(null);
  });

  $('#save').on('click', function() {
    saveImage(getHashParameters());
  });



  var getHashParameters = function() {
    var hash = window.location.hash;
    var key = null;
    if (hash.indexOf(loadRoute) === 0) {
      key = hash.substring(loadRoute.length);
    }

    console.log('getHashParameters', key);
    return key;
  };

  var loadImage = function() {
    //http://192.168.2.109:8000/sonogram.html#%7B%22imgKey%22%3A%22sonogram_image_abb14b488e7b%22%7D

    var key = getHashParameters();
    console.log('loadInitialImage', key);
    if (key) {
      console.log('getting for value', key);
      imagesDataRef.child(key).once('value', function(data) {
        var saveData = data.val();
        console.log('loaded', saveData);
        $('#wPaint').wPaint('image', saveData.img);
        $.each(saveData.settings, function(key, value) {
          if (sonoModel.exists(key)) {
            sonoModel.get(key).set(value);
          }
        });

      });
    } else {
      var defaultImage = $('#defaultImage').attr('src');
      //console.log('defaultImage', defaultImage);
      $('#wPaint').wPaint('image', defaultImage);
      //Kind of a hack
      $('#wPaint').wPaint('_addUndo');
    }
  };

  sonoModel.get('numOscillators').addChangeListener(drawGrid);
  sonoModel.get('startNote').addChangeListener(drawGrid);
  sonoModel.get('startOctave').addChangeListener(drawGrid);
  sonoModel.get('musicalScale').addChangeListener(drawGrid);
  drawGrid();
  stepSelector.bind('mousedown', function(e) {
    isSelectorClicked = true;
    sequencer.jumpToStep(e.pageX - stepSelector.offset().left);
  });

  stepSelector.bind('mouseup', function() {
    isSelectorClicked = false;
  });

  stepSelector.bind('mousemove', function(e) {
    if (isSelectorClicked) {
      sequencer.jumpToStep(e.pageX - stepSelector.offset().left);
    }
  });

  //window.onhashchange = loadImage;
  loadImage();
  $('#stopPlayToggle').sgStartupTooltip(2000, 3000);
}