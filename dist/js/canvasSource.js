/*exported CanvasSource */
'use strict';

function CanvasSource(canvas, overlayCanvas, numOscillators) {

  //var canvas = document.getElementById(elementId);
  var context = canvas.getContext('2d');
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
        var scaledY = Math.floor(y * heightScale);
        var scaledYEnd = Math.floor((y + 1) * heightScale);
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