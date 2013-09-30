function OscSynth(numOscillators, startNote, startOctave, musicalScale, numOctaves,
  volume, delayTime, delayFeedbackGain, delayWetGain) {


  var createAudioContext = function() {
    if (window.webkitAudioContext) {
      return new webkitAudioContext()
    } else if (window.AudioContext) {
      return new AudioContext()
    } else {
      alert("Web Audio not supported")
      throw new Error("Web Audio not supported (could not create audio context");
    }
  };


  //


  var rebuildOscillators = null;
  var oscillators = [];
  var context = createAudioContext();

  var masterGain = context.createGain();
  bindParameterToProperty(masterGain.gain, volume);
  masterGain.connect(context.destination);

  var compressor = context.createDynamicsCompressor()
  compressor.connect(masterGain);

  var delayNode = new SlapbackDelayNode(context, delayTime, delayFeedbackGain, delayWetGain);
  //delayNode.delayTime = delay.get();
  delayNode.connect(compressor);

  var inputForOscillators = delayNode.input;



  volume.addChangeListener(function(val) {
    masterGain.gain.value = val;
  });

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
  }

  startNote.addChangeListener(rebuildOscillators);
  startOctave.addChangeListener(rebuildOscillators);
  musicalScale.addChangeListener(rebuildOscillators);
  numOctaves.addChangeListener(rebuildOscillators);

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
    oscillator.type = "sine";
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

  function setOscillatorsType(oscillatorType) {
    console.log("setOscillatorsType", oscillatorType)
    for (var i = 0; i < oscillators.length; i++) {
      var osc = oscillators[i].oscillator;
      osc.type = oscillatorType;
    }
  };


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
      if (scale == 'quarter notes') {
        for (var i = 0; i < 12; i++) {
          frequencies.push({
            value: getFrequency(i, n.frequency()),
            name: n.latin() + octave + '_' + (i+1)
          });        
        }
      } else {
        var majorScale = n.scale(scale);
        // then loop through scale array for each note object 
        for (var i = 0; i < majorScale.length - 1; i++) {
          frequencies.push({
            value: majorScale[i].frequency(),
            name: majorScale[i].latin() + octave
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
  };



  init();

  return {
    play: play,
    setOscillatorsType: setOscillatorsType,
    compressor: compressor,
    masterGain: masterGain.gain,
    getOscillatorData: getOscillatorData,
  }
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
  }

  var markStep = function(stepIndex) {
    overlayContext.clearRect(markedStep - 1, 0, markedStep + 1, overlayCanvas.height);
    overlayContext.beginPath();
    overlayContext.moveTo(stepIndex, 0);
    overlayContext.lineTo(stepIndex, overlayCanvas.height);
    overlayContext.stroke();
    markedStep = stepIndex;
  }


  return {
    getStep: function(stepIndex) {
      // get just the corresponding row for this step
      var imageData = context.getImageData(stepIndex, 0, 1, canvas.height);
      var data = imageData.data;
      var heightScale = getHeightScale();

      step = [];
      for (var y = 0, numOsc = numOscillators.get(); y < numOsc; y++) {

        // Use scaling by averging the pixels in the scale
        var scaledY = parseInt(y * heightScale);
        var scaledYEnd = parseInt((y + 1) * heightScale);
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
          if (alpha != 0) {

            amp = (255 - ((red + green + blue) / 3)) * (alpha / 255);
            if (amp > 255 || amp < 0) {
              console.log(red, green, blue, alpha, amp);
            }
          }
          ampSum += amp;
          scaledY++;
        }
        var amp = ampSum / pixelsToSum / 255;
        step.push(amp);
      }

      markStep(stepIndex);
      //console.log("step", step);
      return step;
    },
    numSteps: numSteps,
    getOscillatorForY: function(y) {
      var oscIndex = parseInt(y / getHeightScale());
      return oscIndex;
    }
  }
}


function Sequencer(synth, source, stepDuration) {

  var currStep = 0;
  var numSteps = source.numSteps;
  var isPlaying = true;
  var isStarted = false;

  var moveToNextStep = function() {
    if (isPlaying) {
      currStep = (currStep + 1) % numSteps;
    }
  }

  var jumpToStep = function(newStep) {
    newStep = parseInt(newStep);
    //console.log('jumpToStep', newStep);
    currStep = newStep;
    var step = source.getStep(currStep);
    synth.play(step);
  }

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

  var pauseToggle = function() {
    isPlaying = !isPlaying;
    console.log('pauseToggle', isPlaying);
  }

  return {
    start: start,
    pauseToggle: pauseToggle,
    jumpToStep: jumpToStep
  }
}

function getScaledImageData(origCanvasId, width, height) {
  origCanvas = document.getElementById(origCanvasId).getContext('2d');

  var tempCanvas = document.createElement('canvas');
  var tempContext = prevCanvas.getContext('2d');
  tempContext.webkitImageSmoothingEnabled = false;
  tempContext.mozImageSmoothingEnabled = false;
  tempContext.imageSmoothingEnabled = false;

  tempContext.drawImage(origCanvas.canvas, 0, 0, width, height);
  return tempContext.getImageData(0, 0, width, height);
  //return prevCanvas.getImageData(0, 0, width, height);
}