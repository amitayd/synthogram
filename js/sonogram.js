/*exported OscSynth, CanvasSource, Sequencer */

function OscSynth(numOscillators, startNote, startOctave, musicalScale, numOctaves,
  volume, delayTime, delayFeedbackGain, delayWetGain, waveShape) {


  var createAudioContext = function() {
    if (window.AudioContext) {
      return new window.AudioContext();
    } else {
      throw new Error("Web Audio not supported (could not create audio context");
    }
  };

  function bindParameterToProperty(parameter, property) {
    parameter.value = property.get();
    property.addChangeListener(function(value) {
      parameter.value = value;
      console.log('set Parameter value', parameter.value);

    });
  }

  // from http://www.html5rocks.com/en/tutorials/casestudies/jamwithchrome-audio/

  function SlapbackDelayNode(audioContext, delayTime, delayFeedbackGain, delayWetGain) {
    //create the nodes we’ll use
    this.input = audioContext.createGain();
    var output = audioContext.createGain(),
      delay = audioContext.createDelay(),
      feedback = audioContext.createGain(),
      wetLevel = audioContext.createGain();

    bindParameterToProperty(delay.delayTime, delayTime);
    bindParameterToProperty(feedback.gain, delayFeedbackGain);
    bindParameterToProperty(wetLevel.gain, delayWetGain);

    //set up the routing
    this.input.connect(delay);
    this.input.connect(output);
    delay.connect(feedback);
    delay.connect(wetLevel);
    feedback.connect(delay);
    wetLevel.connect(output);

    this.connect = function(target) {
      output.connect(target);
    };
  }

  var oscillators = [];
  var context = createAudioContext();

  var masterGain = context.createGain();
  bindParameterToProperty(masterGain.gain, volume);
  masterGain.connect(context.destination);

  var compressor = context.createDynamicsCompressor();
  compressor.connect(masterGain);

  var delayNode = new SlapbackDelayNode(context, delayTime, delayFeedbackGain, delayWetGain);
  delayNode.connect(compressor);

  var inputForOscillators = delayNode.input;

  var construct = function() {
    volume.addChangeListener(function(val) {
      masterGain.gain.value = val;
    });
    startNote.addChangeListener(rebuildOscillators);
    startOctave.addChangeListener(rebuildOscillators);
    musicalScale.addChangeListener(rebuildOscillators);
    numOctaves.addChangeListener(rebuildOscillators);
    waveShape.addChangeListener(setOscillatorsType);
  };

  var rebuildOscillators = function() {
    console.log('rebuildOscillators');
    var i = oscillators.length;
    while (i > 0) {
      i--;
      oscillators[i].gainNode.disconnect();
      oscillators[i].oscillator.disconnect();
    }

    oscillators = [];

    init();
  };

  var init = function() {
    console.log("initializing");
    var frequencies = getFrequencies(startNote.get(), startOctave.get(), musicalScale.get(), numOctaves.get());
    var i = frequencies.length;
    while (i > 0) {
      i--;
      oscillators.push(createOscillator(frequencies[i]));
    }
    numOscillators.set(frequencies.length);
  };



  var createOscillator = function(frequency) {
    //console.log('createOscillator', frequency);

    // Create oscillator and gain node.
    var oscillator = context.createOscillator(),
      gainNode = context.createGain();

    // Set the type and frequency of the oscillator.
    oscillator.type = waveShape.get();
    oscillator.frequency.value = frequency.value;

    // Set volume of the oscillator.
    gainNode.gain.value = 0;

    // Route oscillator through gain node to speakers.
    oscillator.connect(gainNode);
    gainNode.connect(inputForOscillators);

    // Start oscillator playing.
    oscillator.start(0);

    return {
      oscillator: oscillator,
      gain: gainNode.gain,
      gainNode: gainNode,
      frequency: frequency.value,
      name: frequency.name,
    };
  };

  function setOscillatorsType() {
    for (var i = 0; i < oscillators.length; i++) {
      var osc = oscillators[i].oscillator;
      // Hack for the webkit shim
      if (osc.typeByName) {
        osc.typeByName(waveShape.get());
      } else {
        osc.type = waveShape.get();
      }
    }
  }


  function getFrequency(n, startFrequency) {
    // http://www.phy.mtu.edu/~suits/NoteFreqCalcs.html
    //var f0 = 440;
    var f0 = startFrequency;
    var a = Math.pow(2, 1 / 12.0);
    var freq = f0 * Math.pow(a, n);
    return freq;
  }


  function getFrequencies(startNote, startOctave, scale, numOctaves) {
    var frequencies = [];
    for (var octave = startOctave; octave < startOctave + numOctaves; octave++) {
      var noteLatin = startNote + octave;
      var n = Note.fromLatin(noteLatin);
      if (scale === 'quarter notes') {
        for (var quarterIndex = 0; quarterIndex < 12; quarterIndex++) {
          frequencies.push({
            value: getFrequency(quarterIndex, n.frequency()),
            name: n.latin() + octave + '_' + (quarterIndex + 1)
          });
        }
      } else {
        var majorScale = n.scale(scale);
        // then loop through scale array for each note object 
        for (var noteIndex = 0; noteIndex < majorScale.length - 1; noteIndex++) {
          frequencies.push({
            value: majorScale[noteIndex].frequency(),
            name: majorScale[noteIndex].latin() + octave
          });
        }
      }
    }

    return frequencies;
  }

  function getOscillatorData(oscillatorNum) {
    //console.log('getOscillatorData', oscillatorNum)
    var oscillator = oscillators[oscillatorNum];
    return {
      frequency: oscillator.frequency,
      name: oscillator.name
    };
  }



  var gainThreshold = 0.001;
  var play = function(step) {
    for (var i = 0; i < oscillators.length; i++) {
      // TODO: better gain normalization (perhaps based on the number of active oscillators?)
      var normalizedGain = step[i] * 0.1;
      if (Math.abs(oscillators[i].gain.value - normalizedGain) > gainThreshold) {
        //console.log('set gain', oscillators[i].frequency, normalizedGain, oscillators[i].gain.value);
        oscillators[i].gain.value = normalizedGain;
      }
    }
  };

  construct();
  init();

  return {
    play: play,
    setOscillatorsType: setOscillatorsType,
    compressor: compressor,
    masterGain: masterGain.gain,
    getOscillatorData: getOscillatorData,
  };
}


function CanvasSource(canvas, overlayId, numOscillators) {

  //var canvas = document.getElementById(elementId);
  var context = canvas.getContext('2d');
  var overlayCanvas = document.getElementById(overlayId);
  var overlayContext = overlayCanvas.getContext('2d');
  var numSteps = canvas.width;
  var markedStep = 0;

  var getHeightScale = function() {
    return canvas.height / numOscillators.get();
  };

  var markStep = function(stepIndex) {
    overlayContext.clearRect(markedStep - 1, 0, markedStep + 1, overlayCanvas.height);
    overlayContext.beginPath();
    overlayContext.moveTo(stepIndex, 0);
    overlayContext.lineTo(stepIndex, overlayCanvas.height);
    overlayContext.stroke();
    markedStep = stepIndex;
  };


  return {
    getStep: function(stepIndex) {
      // get just the corresponding row for this step
      var imageData = context.getImageData(stepIndex, 0, 1, canvas.height);
      var data = imageData.data;
      var heightScale = getHeightScale();

      var step = [];
      for (var y = 0, numOsc = numOscillators.get(); y < numOsc; y++) {

        // Use scaling by averging the pixels in the scale
        var scaledY = parseInt(y * heightScale, 10);
        var scaledYEnd = parseInt((y + 1) * heightScale, 10);
        var pixelsToSum = scaledYEnd - scaledY;
        var ampSum = 0;
        while (scaledY < scaledYEnd) {
          // get the channels
          var red = data[(scaledY) * 4 + 0];
          var green = data[(scaledY) * 4 + 1];
          var blue = data[(scaledY) * 4 + 2];
          var alpha = data[(scaledY) * 4 + 3];

          // compute amplitude as the avg of all colors divided by alpha          
          var amp = 0;
          if (alpha !== 0) {

            amp = (255 - ((red + green + blue) / 3)) * (alpha / 255);
            if (amp > 255 || amp < 0) {
              console.log(red, green, blue, alpha, amp);
            }
          }
          ampSum += amp;
          scaledY++;
        }
        var finalAmp = ampSum / pixelsToSum / 255;
        step.push(finalAmp);
      }

      markStep(stepIndex);
      //console.log("step", step);
      return step;
    },
    numSteps: numSteps,
    getOscillatorForY: function(y) {
      var oscIndex = parseInt(y / getHeightScale(), 10);
      return oscIndex;
    }
  };
}


function Sequencer(synth, source, stepDuration) {

  var currStep = 0;
  var numSteps = source.numSteps;
  var isPlaying = false;
  var isStarted = false;

  var moveToNextStep = function() {
    if (isPlaying) {
      currStep = (currStep + 1) % numSteps;
    }
  };

  var jumpToStep = function(newStep) {
    newStep = parseInt(newStep, 10);
    //console.log('jumpToStep', newStep);
    currStep = newStep;
    var step = source.getStep(currStep);
    synth.play(step);
  };

  var start = function() {
    console.log('seq.play');
    if (isStarted) {
      return;
    }

    isStarted = true;

    function loop() {
      var step = source.getStep(currStep);
      synth.play(step);
      moveToNextStep();
      window.setTimeout(loop, stepDuration.get());
    }

    loop();
  };

  var setIsPlaying = function(isPlayingParam) {
    isPlaying = isPlayingParam;
    console.log('pauseToggle', isPlaying);
  };

  return {
    start: start,
    setIsPlaying: setIsPlaying,
    jumpToStep: jumpToStep,
    isPlaying: function() {
      return isPlaying;
    }
  };
}