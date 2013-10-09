// Based on https://github.com/g200kg/WAAPISim

if (typeof(webkitAudioContext) !== "undefined") {
  if (typeof(webkitAudioContext.prototype.createGain) === "undefined") {
    webkitAudioContext.prototype.createScriptProcessor = webkitAudioContext.prototype.createJavaScriptNode;
    webkitAudioContext.prototype.createGain = (function() {
      var o = webkitAudioContext.prototype.createGainNode.call(this);
      o._gain = o.gain;
      o.gain = o._gain;
      o.gain.setTargetAtTime = o._gain.setTargetValueAtTime;
      return o;
    });
    webkitAudioContext.prototype.createDelay = (function() {
      var o = webkitAudioContext.prototype.createDelayNode.call(this);
      o._delayTime = o.delayTime;
      o.delayTime = o._delayTime;
      o.delayTime.setTargetAtTime = o._delayTime.setTargetValueAtTime;
      return o;
    });
    webkitAudioContext.prototype._createOscillator = webkitAudioContext.prototype.createOscillator;
    webkitAudioContext.prototype.createOscillator = (function() {
      var o = webkitAudioContext.prototype._createOscillator.call(this);
      o._frequency = o.frequency;
      o.frequency = o._frequency;
      o.frequency.setTargetAtTime = o._frequency.setTargetValueAtTime;
      o._detune = o.detune;
      o.detune = o._detune;
      o.detune.setTargetAtTime = o._detune.setTargetValueAtTime;
      o.start = o.noteOn;
      o.stop = o.noteOff;
      o.typeByName = function(oscType) {
        var typeToInt = {
          sine: 0,
          square: 1,
          sawtooth: 2,
          triangle: 3
        };

        var translatedType = typeToInt[oscType];
        return o.type = translatedType;
      };
      return o;
    });
    webkitAudioContext.prototype._createBufferSource = webkitAudioContext.prototype.createBufferSource;
    webkitAudioContext.prototype.createBufferSource = (function() {
      var o = webkitAudioContext.prototype._createBufferSource.call(this);
      o._playbackRate = o.playbackRate;
      o.playbackRate = o._playbackRate;
      o.playbackRate.setTargetAtTime = o._playbackRate.setTargetValueAtTime;
      o.start = function(w, off, dur) {
        if (off === undefined)
          o.noteOn(w);
        else
          o.noteGrainOn(w, off, dur);
      };
      o.stop = o.noteOff;
      return o;
    });
    webkitAudioContext.prototype._createBiquadFilter = webkitAudioContext.prototype.createBiquadFilter;
    webkitAudioContext.prototype.createBiquadFilter = (function() {
      var o = webkitAudioContext.prototype._createBiquadFilter.call(this);
      o._frequency = o.frequency;
      o.frequency = o._frequency;
      o.frequency.setTargetAtTime = o._frequency.setTargetValueAtTime;
      o._Q = o.Q;
      o.Q = o._Q;
      o.Q.setTargetAtTime = o._Q.setTargetValueAtTime;
      o._gain = o.gain;
      o.gain = o._gain;
      o.gain.setTargetAtTime = o._gain.setTargetValueAtTime;
      return o;
    });
    webkitAudioContext.prototype._createDynamicsCompressor = webkitAudioContext.prototype.createDynamicsCompressor;
    webkitAudioContext.prototype.createDynamicsCompressor = (function() {
      var o = webkitAudioContext.prototype._createDynamicsCompressor.call(this);
      o._threshold = o.threshold;
      o.threshold = o._threshold;
      o.threshold.setTargetAtTime = o._threshold.setTargetValueAtTime;
      o._knee = o.knee;
      o.knee = o._knee;
      o.knee.setTargetAtTime = o._knee.setTargetValueAtTime;
      o._ratio = o.ratio;
      o.ratio = o._ratio;
      o.ratio.setTargetAtTime = o._ratio.setTargetValueAtTime;
      o._attack = o.attack;
      o.attack = o._attack;
      o.attack.setTargetAtTime = o._attack.setTargetValueAtTime;
      return o;
    });
  }

  window.AudioContext = webkitAudioContext;
}