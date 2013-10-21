/*exported  synthogramInit */
/*globals  Muscula, $, window, Model, CanvasSource, OscSynth, Sequencer, Firebase, sgResources */
function synthogramInit() {

  // MODEL CREATION
  var sonoModel = new Model({
    stepsPerSecond: 40,
    volume: 0.5,
    numOscillators: 80,
    startFrequency: 55,
    delayTime: 0.125,
    delayFeedbackGain: 0.25,
    delayWetGain: 0.3,
    startNote: 'C',
    startNoteKey: 'C',
    startNoteAccidental: '',
    startOctave: 4,
    musicalScale: 'major',
    numOctaves: 2,
    waveShape: 'sine',
    isPlaying: false,
    isSynthPlaying: false,
    currentStep: 0,
    isMuted: false
  });

  // Property computations
  
  // Set the sequencer to playing stopping according to this.
  sonoModel.get('isSynthPlaying').addChangeListener(function(value) {
    sonoModel.get('isPlaying').set(value);
  });

  // TODO: refactor into some way to add computed properties
  // Todo two way conversion: note <==> (key,accidental)
  sonoModel.get('startNoteKey').addChangeListener(function() {
    sonoModel.get('startNote').set(sonoModel.getVal('startNoteKey') + sonoModel.getVal('startNoteAccidental'));
  });  

  sonoModel.get('startNoteAccidental').addChangeListener(function() {
    sonoModel.get('startNote').set(sonoModel.getVal('startNoteKey') + sonoModel.getVal('startNoteAccidental'));
  });  

  sonoModel.get('startNote').addChangeListener(function(value) {
    sonoModel.setVal('startNoteKey', value[0]);
    if (value.length > 1) {
      sonoModel.setVal('startNoteAccidental', value[1]);
    }
  });

  var unMuteVolume = 0.5;
  // When mute is set
  sonoModel.get('isMuted').addChangeListener(function(isMuted) {
    if (isMuted) {
      var currentVolume = sonoModel.getVal('volume');
      if (currentVolume !== 0) {
        unMuteVolume = currentVolume;
        sonoModel.setVal('volume', 0);
      }
    } else {
      if (sonoModel.getVal('volume') === 0) {
        sonoModel.setVal('volume', unMuteVolume);
      }
    }
  });

  // When volume is set to 0 set Muted to 
  sonoModel.get('volume').addChangeListener(function(volume) {
    if (volume === 0) {
      sonoModel.setVal("isMuted", true);
    } else {
      sonoModel.setVal("isMuted", false);
    }
  });
  


  // END MODEL CREATION


  // SET UP UI
  
  $('.compSide').sgTab();
  $('.harmony.tab-label').click();
  $('.button').sgButton(sonoModel);
  $('.horizontal-slider').sgSlider(sonoModel);
  $('.buttonset').sgButtonSet(sonoModel);
  $('.knob').sgKnob(sonoModel);

  var setCurrentPosition = function(value) {
    var text = value + ' / ' + $('#wPaint').width();
    $('.current-position').text(text);
  };

  sonoModel.get('currentStep').addChangeListener(setCurrentPosition);
  setCurrentPosition(0);


  // override some wPaint settings
  $.fn.wPaint.menus.text.items.fontSize.range = [8, 9, 10, 12, 14, 16, 20, 24, 30, 40, 50, 60];
  $('#wPaint').wPaint({
    path: 'lib/wpaint/',
    menuOffsetLeft: -115, // left offset of primary menu
    menuOffsetTop: -46,
    lineWidth: '4', // starting line width
    fillStyle: '#0000FF', // starting fill style
    strokeStyle: '#000000', // start stroke style
    menuHandle: false
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

  var source = new CanvasSource(wPaintCanvas[0], 'overlay',
    sonoModel.get('numOscillators')
  );

  $('.transparentOverlay').on('touchstart touchmove touchend touchcancel', function() {
    return false;
  });


  var drawGrid = function() {
    var xStep = 8;
    var yStep = Number($('#overlayGrid').attr('height')) / sonoModel.getVal('numOscillators');
    var legendFunc = function(y) {
      var oscData = getOscDataForY(y);
      return oscData.name;
    };

    console.log('drawing grid', xStep, yStep);
    $('#overlayGrid').sgGrid(xStep, yStep);
    $('#gridLabelsCanvas').sgGridLabels(yStep, legendFunc);
    $('#wPaint').wPaint('snapGridVertical', yStep);
    $('#wPaint').wPaint('snapGridHorizontal', xStep);

  };

  var livePad = function livePad(el) {
    var isMouseDown;
    var interval;
    var lastCoordinates;

    var getCoordinates = function(e) {
      var coordinates = {};
      if (!e) {
        // TODO: change to some deepCopy
        coordinates = {
          x: sonoModel.getVal('currentStep') + Math.ceil(lastCoordinates.size / 2),
          y: lastCoordinates.y,
          size: lastCoordinates.size
        };
      } else {
        coordinates.size = Math.floor(((e.pageX - el.offset().left) / el.width()) * 20);
        coordinates.size = Math.max(coordinates.size, 1);
        coordinates.x = sonoModel.getVal('currentStep') + Math.ceil(coordinates.size / 2);
        coordinates.y = e.pageY - el.offset().top;
      }

      // Not entirely sure why needed, but other wise small lines are now played.
      if (coordinates.size < 2) {
        coordinates.x = coordinates.x + 0.5;
      }


      return coordinates;
    };

    var drawMove = function(e) {
      if (isMouseDown) {
        var coordinates = getCoordinates(e);
        if (lastCoordinates.x > coordinates.x) {
          updateWPaint("paintAtCoordinatesUp");
          updateWPaint("paintAtCoordinatesDown", coordinates);
        } else {
          updateWPaint("paintAtCoordinatesMove", coordinates);
        }
        if (e) {
          drawCursor(e);
        }
      }

    };

    var updateWPaint = function(method, coordinates) {
      $('#wPaint').wPaint(method, coordinates);
      if (coordinates) {
        lastCoordinates = coordinates;
      }
    };


    $('body').on('mousedown', function() {
      isMouseDown = true;
    });

    $('body').on('mouseup', function() {
      isMouseDown = false;
      window.clearInterval(interval);
    });

    el.on('mousedown', function(e) {
      sonoModel.get('isPlaying').set(true);
      sonoModel.get('isSynthPlaying').set(true);
      var coordinates = getCoordinates(e);
      updateWPaint("paintAtCoordinatesDown", coordinates);
      drawCursor(e);
      window.clearInterval(interval);
      interval = window.setInterval(drawMove, 20);
    });

    el.on('mouseup', function() {
      updateWPaint("paintAtCoordinatesUp");
      window.clearInterval(interval);
      $('.livePadCursor').hide();
    });

    el.on('mousemove', function(e) {
      drawMove(e);
    });

    el.bindMobileEventsPreventMouse();


    var drawCursor = function(e) {
      var cursorSize = 60;
      var top = (e.pageY - el.offset().top - cursorSize / 2);
      var left = (e.pageX - el.offset().left - cursorSize / 2);
      $('.livePadCursor').css({
        'top': top,
        'left': left
      });
      $('.livePadCursor').show();
    };
  };

  livePad($('#livePad'));


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

  var synth = new OscSynth(
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

  var sequencer = new Sequencer(synth, source,
    sonoModel.get('stepsPerSecond'), sonoModel.get('currentStep')
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
      'stepsPerSecond',
      'startFrequency',
      'delayTime',
      'delayFeedbackGain',
      'delayWetGain',
      'startNoteKey',
      'startOctave',
      'musicalScale',
      'numOctaves',
      'waveShape'
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

  $('#new').on('click', function() {
    $('#wPaint').wPaint('clear');
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
      $('#wPaint').wPaint('image', sgResources.defaultImage);
      //A hack
      window.setTimeout(function() {
        console.log('addUndo');
        $('#wPaint').wPaint('_addUndo');
      }, 10);
    }
  };

  sonoModel.get('numOscillators').addChangeListener(drawGrid);
  sonoModel.get('startNote').addChangeListener(drawGrid);
  sonoModel.get('startOctave').addChangeListener(drawGrid);
  sonoModel.get('musicalScale').addChangeListener(drawGrid);
  drawGrid();

  loadImage();
}