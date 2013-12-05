/*exported  synthogramInit */
/*globals  Socialite, Muscula, $, window, sgModel, CanvasSource, OscSynth, Sequencer, Firebase, sgResources, ga */
'use strict';

function sgEventReporter(ga) {
  var sent = {};

  var hash = function (action, label, value) {
    return [action, label, value].join('|');
  };

  return {
    send: function (category, action, label, value) {
      console.log('send', 'event', category, action, label, value);
      if (ga) {
        ga('send', 'event', category, action, label, value);

      }
      sent[hash(category, action, label)] = true;
    },
    sendOnce: function (category, action, label, value) {
      if (!sent[hash(category, action, label)]) {
        this.send(category, action, label, value);
      }
    }
  };
}

function sgView(model, eventReporter) {


  // TODO: this should be done in init: it is here because Canvas Source needs it before the init
  // override some wPaint settings
  //$.fn.wPaint.menus.text.items.fontSize.range = [8, 9, 10, 12, 14, 16, 20, 24, 30, 40, 50, 60];
  $('#wPaint').wPaint({
    path: 'lib/wpaint/',
    menuOffsetLeft: -115, // left offset of primary menu
    menuOffsetTop: -46,
    lineWidth: '4', // starting line width
    fillStyle: '#0000FF', // starting fill style
    strokeStyle: '#000000', // start stroke style
    menuHandle: false,
    onShapeDown: function () {
      var mode = $('#wPaint').wPaint('mode');
      eventReporter.send('wPaint', 'paint', mode);
    }
  });
  var wPaintCanvas = $('.wPaint-canvas');

  function init(getOscDataForY, saveImage) {

    $('.compSide').sgTab(eventReporter);
    $('.button').sgButton(model, eventReporter);
    $('.horizontal-slider').sgSlider(model, eventReporter);
    $('.buttonset').sgButtonSet(model, eventReporter);
    $('.knob').sgKnob(model, eventReporter);

    $('.harmony.tab-label').click();

    var setCurrentPosition = function (value) {
      var text = value + ' / ' + $('#wPaint').width();
      $('.current-position').text(text);
    };

    model.get('currentStep').addChangeListener(setCurrentPosition);
    setCurrentPosition(0);




    var freqHerz = $('#freqHertz');
    var freqName = $('#freqName');
    wPaintCanvas.bind('mousemove', function (e) {
      var y = e.pageY - wPaintCanvas.offset().top;
      if (y >= wPaintCanvas.height() || y < 0) {
        return;
      }
      var oscData = getOscDataForY(y);
      freqHerz.text(oscData.frequency.toFixed(2));
      freqName.text(oscData.name);
    }).bind("mouseout", function () {
      freqHerz.text('--');
      freqName.text('--');
    });


    $('.transparentOverlay').on('touchstart touchmove touchend touchcancel', function () {
      return false;
    });

    // TODO: move to ui.js
    var livePad = function livePad(el, eventReporter) {
      var isMouseDown;
      var interval;
      var lastCoordinates;

      var getCoordinates = function (e) {
        var coordinates = {};
        if (!e) {
          // TODO: change to some deepCopy
          coordinates = {
            x: model.getVal('currentStep') + Math.ceil(lastCoordinates.size / 2),
            y: lastCoordinates.y,
            size: lastCoordinates.size
          };
        } else {
          coordinates.size = Math.floor(((e.pageX - el.offset().left) / el.width()) * 20);
          coordinates.size = Math.max(coordinates.size, 1);
          coordinates.x = model.getVal('currentStep') + Math.ceil(coordinates.size / 2);
          coordinates.y = e.pageY - el.offset().top;
        }

        // Not entirely sure why needed, but other wise small lines are now played.
        if (coordinates.size < 2) {
          coordinates.x = coordinates.x + 0.5;
        }


        return coordinates;
      };

      var drawMove = function (e) {
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

      var updateWPaint = function (method, coordinates) {
        $('#wPaint').wPaint(method, coordinates);
        if (coordinates) {
          lastCoordinates = coordinates;
        }
      };


      $('body').on('mousedown', function () {
        isMouseDown = true;
      });

      $('body').on('mouseup', function () {
        isMouseDown = false;
        window.clearInterval(interval);
      });

      el.on('mousedown', function (e) {
        model.get('isPlaying').set(true);
        model.get('isSynthPlaying').set(true);
        var coordinates = getCoordinates(e);
        updateWPaint("paintAtCoordinatesDown", coordinates);
        drawCursor(e);
        window.clearInterval(interval);
        interval = window.setInterval(drawMove, 20);
        eventReporter.send('mousedown', 'livePad', 'livePad');
      });

      el.on('mouseup', function () {
        updateWPaint("paintAtCoordinatesUp");
        window.clearInterval(interval);
        $('.livePadCursor').hide();
      });

      el.on('mousemove', function (e) {
        drawMove(e);
      });

      el.bindMobileEventsPreventMouse();


      var drawCursor = function (e) {
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

    livePad($('#livePad'), eventReporter);

    var drawGrid = function () {
      var legendFunc = function (y) {
        var oscData = getOscDataForY(y);
        return oscData.name;
      };
      var xStep = 8;
      var yStep = Number($('#overlayGrid').attr('height')) / model.getVal('numOscillators');
      console.log('drawing grid', xStep, yStep);
      $('#overlayGrid').sgGrid(xStep, yStep);
      $('#gridLabelsCanvas').sgGridLabels(yStep, legendFunc);
      $('#wPaint').wPaint('snapGridVertical', yStep);
      $('#wPaint').wPaint('snapGridHorizontal', xStep);
    };

    model.get('numOscillators').addChangeListener(drawGrid);
    model.get('startNote').addChangeListener(drawGrid);
    model.get('startOctave').addChangeListener(drawGrid);
    model.get('musicalScale').addChangeListener(drawGrid);
    drawGrid();


    $('#share').on('click', function () {
      //$('#shareContainer').toggle();
      eventReporter.send('click', 'button', 'share');

    });    

    $('#saveNew').on('click', function () {
      saveImage(true);
      eventReporter.send('click', 'button', 'saveCopy');

    });

    $('#save').on('click', function () {
      saveImage(false);
      eventReporter.send('click', 'button', 'save');
    });

    $('#new').on('click', function () {
      $('#wPaint').wPaint('clear');
      eventReporter.send('click', 'button', 'new');
    });

    $('body').on('keydown', function (e) {
      if (e.keyCode === 32) { //spacebar
        // TODO: add an identifier in the html instead of using both classes
        $('.play, .stop').trigger('click');
      } else if (e.ctrlKey && e.keyCode === 90) {
        if (e.shiftKey) {
          $('#wPaint').wPaint('redo');
        } else {
          $('#wPaint').wPaint('undo');
        }
      }

    });

    Socialite.load();



  } //end init()

  var setImage = function (imageData) {
    $('#wPaint').wPaint('image', imageData);
    //A hack, not sure why/if this is needed
    window.setTimeout(function () {
      console.log('addUndo');
      $('#wPaint').wPaint('_addUndo');
    }, 10);
  };

  var showNotSupported = function () {
    $("#notSupportedModal").dialog({
      height: 200,
      width: 350,
      modal: true
    });
  };

  return {
    paintCanvas: wPaintCanvas[0],
    overlayCanvas: window.document.getElementById('overlay'),
    init: init,
    showNotSupported: showNotSupported,
    setImage: setImage
  };

}

function sgMainController(model, view, sequencer, synth, source, eventReporter) {
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

  // TODO: move firebase script to load Async
  var imagesDataRef = Firebase ? new Firebase('https://sonogram.firebaseio.com/images') : null;


  var getOscDataForY = function (y) {
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

  var saveImage = function (saveNew) {
    var key = null;
    if (!saveNew) {
      key = getHashParameters();
    }

    var getRandomKey = function () {
      var r6 = function () {
        return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
      };
      return r6() + r6();
    };

    // If no key is specified, create a new one
    key = key || getRandomKey();
    var img = $("#wPaint").wPaint("image");


    var saveData = {
      img: img,
      settings: {},
      saveDate: new Date().toISOString()
    };

    $.each(settingsToSave, function (index, settingKey) {
      saveData.settings[settingKey] = model.getVal(settingKey);
    });


    imagesDataRef.child(key).set(saveData, function () {
      console.log('saved', saveData);
      window.location.hash = loadRoute + key;
    });
  };

  // TODO: Implement using History API or use some routing componenet, this is horrible.
  // Possible library : https://github.com/millermedeiros/crossroads.js
  // History API: https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history
  var loadRoute = '#load/';
  var getHashParameters = function () {
    var hash = window.location.hash;
    var key = null;
    if (hash.indexOf(loadRoute) === 0) {
      key = hash.substring(loadRoute.length);
    }

    console.log('getHashParameters', key);
    return key;
  };

  var loadImage = function () {
    //http://192.168.2.109:8000/sonogram.html#%7B%22imgKey%22%3A%22sonogram_image_abb14b488e7b%22%7D

    var key = getHashParameters();
    console.log('loadInitialImage', key);
    if (key) {
      console.log('getting for value', key);
      imagesDataRef.child(key).once('value', function (data) {
        var saveData = data.val();
        console.log('loaded', saveData);
        view.setImage(saveData.img);
        $.each(saveData.settings, function (key, value) {
          if (model.exists(key)) {
            model.get(key).set(value);
          }
        });

      });
    } else {
      view.setImage(sgResources.defaultImage);
    }
  };


  var init = function () {
    if (typeof AudioContext === 'undefined') {
      // No Audio Context - show error
      if (typeof Muscula !== 'undefined') {
        Muscula.errors.push(new Error('Browser not supported for Synthogram'));
      }
      view.showNotSupported();
      eventReporter.send('not_supported', 'audioContext', 'audio context not supported', 0);
      return;
    } else {
      eventReporter.send('supported', 'audioContext', 'audio context supported', 1);
    }



    model.get('isPlaying').addChangeListener(function (value) {
      sequencer.setIsPlaying(value);
    });

    sequencer.start();

    view.init(getOscDataForY, saveImage);
    loadImage();
  };

  return {
    init: init
  };

}


function synthogramInit() {

  var eventReporter = sgEventReporter(ga);

  // TODO: Why is the model a function: kind of ugly
  var model = sgModel().createSynthogramModel();
  console.log(model);
  var view = sgView(model, eventReporter);
  var source = new CanvasSource(view.paintCanvas, view.overlayCanvas, model.get('numOscillators'));
  var synth = new OscSynth(
    model.get('numOscillators'),
    model.get('startNote'),
    model.get('startOctave'),
    model.get('musicalScale'),
    model.get('numOctaves'),
    model.get('volume'),
    model.get('delayTime'),
    model.get('delayFeedbackGain'),
    model.get('delayWetGain'),
    model.get('waveShape'),
    model.get('isSynthPlaying')
  );
  var sequencer = new Sequencer(synth, source,
    model.get('stepsPerSecond'), model.get('currentStep')
  );

  var controller = sgMainController(model, view, sequencer, synth, source, eventReporter);
  controller.init();





}