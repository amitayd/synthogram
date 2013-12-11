/*exported  sgMainController */
/*globals  Muscula, $, window, Firebase, sgResources */
'use strict';

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
      view.showShareDialog();
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