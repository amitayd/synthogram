/*exported  SgAPI */
/*globals  $ */

'use strict';

function SgAPI(canvas, model) {
  var ctx = canvas.getContext("2d");
  var $canvas = $(canvas);
  var canvasHeight = $canvas.height();
  var canvasWidth = $canvas.width();
  var stepWidth = 8;

  return {

    drawNote: function (x, y, duration, color) {
      ctx.fillStyle = color || "#000000";
      var noteWidth = stepWidth * (duration || 1); //TODO: add it to the model/const/something
      var noteHeight = canvasHeight / model.getVal('numOscillators');

      var noteCanvasX = x * stepWidth + 1;
      var noteCanvasY = canvasHeight - (y + 1) * noteHeight + 2;

      ctx.fillRect(noteCanvasX, noteCanvasY, noteWidth - 2, noteHeight - 3);
    },
    getCanvasContext: function() {
      return canvas.getContext('2d');
    },

    getCanvas: function() {
      return canvas;
    },

    getNumSteps: function() {
      return canvasWidth / stepWidth;
    },

    getNumNotes: function() {
      return model.getVal('numOscillators');
    }




  };


}