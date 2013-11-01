/*exported sgModel */
'use strict';

function sgModel() {
  function ModelProperty(name, value, changeListeners) {
    this.name = name;
    this.value = value;
    this.changeListeners = changeListeners;
  }

  ModelProperty.prototype.set = function (value) {
    if (value === this.value) {
      return;
    }
    //console.log('set', this.name, value);
    this.value = value;
    var listeners = this.changeListeners;
    for (var i = 0; i < listeners.length; i++) {
      listeners[i].call(this, this.value);
    }
  };

  ModelProperty.prototype.get = function () {
    return this.value;
  };


  ModelProperty.prototype.addChangeListener = function (listener) {
    this.changeListeners.push(listener);
  };


  function Model(defaultProperties) {
    this.properties = defaultProperties;

    for (var propName in defaultProperties) {
      var value = defaultProperties[propName];
      this.properties[propName] = new ModelProperty(propName, value, []);
    }
  }

  Model.prototype.get = function (propName) {
    if (!this.exists(propName)) {
      throw new Error('property "' + propName + '" is not in model.');
    }

    return this.properties[propName];
  };

  Model.prototype.setVal = function (propName, val) {
    this.get(propName).set(val);
  };

  Model.prototype.getVal = function (propName) {
    return this.get(propName).get();
  };

  Model.prototype.exists = function (propName) {
    return (propName in this.properties);
  };

  function createSynthogramModel() {
    var model = new Model({
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
    model.get('isSynthPlaying').addChangeListener(function (value) {
      model.get('isPlaying').set(value);
    });

    // TODO: refactor into some way to add computed properties
    // Todo two way conversion: note <==> (key,accidental)
    model.get('startNoteKey').addChangeListener(function () {
      model.get('startNote').set(model.getVal('startNoteKey') + model.getVal('startNoteAccidental'));
    });

    model.get('startNoteAccidental').addChangeListener(function () {
      model.get('startNote').set(model.getVal('startNoteKey') + model.getVal('startNoteAccidental'));
    });

    model.get('startNote').addChangeListener(function (value) {
      model.setVal('startNoteKey', value[0]);
      if (value.length > 1) {
        model.setVal('startNoteAccidental', value[1]);
      }
    });

    var unMuteVolume = 0.5;
    // When mute is set
    model.get('isMuted').addChangeListener(function (isMuted) {
      if (isMuted) {
        var currentVolume = model.getVal('volume');
        if (currentVolume !== 0) {
          unMuteVolume = currentVolume;
          model.setVal('volume', 0);
        }
      } else {
        if (model.getVal('volume') === 0) {
          model.setVal('volume', unMuteVolume);
        }
      }
    });

    // When volume is set to 0 set Muted to 
    model.get('volume').addChangeListener(function (volume) {
      if (volume === 0) {
        model.setVal("isMuted", true);
      } else {
        model.setVal("isMuted", false);
      }
    });

    return model;
  }

  return {
    createSynthogramModel: createSynthogramModel
  };
}