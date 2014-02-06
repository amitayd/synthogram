/*exported  sgView */
/*globals  Socialite, $, window */
'use strict';

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

    $('#livePad, #wPaint').bind('mousemove', function (e) {
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
        $('.livePadCursor').addClass('active');
      });

      el.on('mouseup', function () {
        updateWPaint("paintAtCoordinatesUp");
        window.clearInterval(interval);
        $('.livePadCursor').removeClass('active');
      });

      el.on('mousemove', function (e) {
        drawMove(e);
        drawCursor(e);
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
      $('#livePadGrid').sgGrid(0, yStep);
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
      saveImage(true);
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
      //TODO: hack-ish
      window.location.hash = '';
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
    setImage: setImage,
    showShareDialog: function() {
      $('#shareUrl').text(window.location);
      $('#shareDialog').dialog({minWidth: 500});
    }
  };

}