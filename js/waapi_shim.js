// Based on https://github.com/g200kg/WAAPISim

if (typeof(AudioContext) == "undefined" && typeof(webkitAudioContext) !== "undefined") {

  if (!webkitAudioContext.prototype.createOscillator) {
    window.AudioContext = webkitAudioContext
  };
  if (typeof(webkitAudioContext.prototype.createGain) === "undefined") {
    webkitAudioContext.prototype.createScriptProcessor = webkitAudioContext.prototype.createJavaScriptNode;
    webkitAudioContext.prototype.createGain = (function() {
      var o = webkitAudioContext.prototype.createGainNode.call(this);
      return o;
    });
    webkitAudioContext.prototype.createDelay = (function() {
      var o = webkitAudioContext.prototype.createDelayNode.call(this);
      return o;
    });
    webkitAudioContext.prototype._createOscillator = webkitAudioContext.prototype.createOscillator;
    webkitAudioContext.prototype.createOscillator = (function() {
      var o = webkitAudioContext.prototype._createOscillator.call(this);
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
      return o;
    });
    webkitAudioContext.prototype._createDynamicsCompressor = webkitAudioContext.prototype.createDynamicsCompressor;
    webkitAudioContext.prototype.createDynamicsCompressor = (function() {
      var o = webkitAudioContext.prototype._createDynamicsCompressor.call(this);
      return o;
    });
  }

  window.AudioContext = webkitAudioContext;
}