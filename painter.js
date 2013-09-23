/* © 2009 ROBO Design
 * http://www.robodesign.ro
 */

// Keep everything in anonymous function, called on window load.

function addPainter() {
  var canvas, context, canvaso, contexto;

  // The active tool instance.
  var tool;
  var tool_default = 'line';

  function init() {
    // Find the canvas element.
    canvaso = document.getElementById('imageView');

    // Get the 2D canvas context.
    contexto = canvaso.getContext('2d');

    // Add the temporary canvas.
    var container = canvaso.parentNode;
    canvas = document.createElement('canvas');

    canvas.id = 'imageTemp';
    canvas.width = canvaso.width;
    canvas.height = canvaso.height;
    container.appendChild(canvas);

    context = canvas.getContext('2d');

    // Get the tool select input.
    var tool_select = document.getElementById('dtool');
    tool_select.addEventListener('change', ev_tool_change, false);

    // Activate the default tool.
    if (tools[tool_default]) {
      tool = new tools[tool_default]();
      tool_select.value = tool_default;
    }

    // Attach the mousedown, mousemove and mouseup event listeners.
    canvas.addEventListener('mousedown', ev_canvas, false);
    canvas.addEventListener('mousemove', ev_canvas, false);
    canvas.addEventListener('mouseup', ev_canvas, false);
  }

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.

  function ev_canvas(ev) {
    if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }

    // Call the event handler of the tool.
    var func = tool[ev.type];
    if (func) {
      func(ev);
    }
  }

  // The event handler for any changes made to the tool selector.

  function ev_tool_change(ev) {
    if (tools[this.value]) {
      tool = new tools[this.value]();
    }
  }

  // This function draws the #imageTemp canvas on top of #imageView, after which 
  // #imageTemp is cleared. This function is called each time when the user 
  // completes a drawing operation.

  function img_update() {
    contexto.drawImage(canvas, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  // This object holds the implementation of each drawing tool.
  var tools = {};

  // The drawing pencil.
  tools.pencil = function() {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function(ev) {
      context.beginPath();
      context.moveTo(ev._x, ev._y);
      tool.started = true;
    };

    // This function is called every time you move the mouse. Obviously, it only 
    // draws if the tool.started state is set to true (when you are holding down 
    // the mouse button).
    this.mousemove = function(ev) {
      if (tool.started) {
        context.lineTo(ev._x, ev._y);
        context.stroke();
      }
    };

    // This is called when you release the mouse button.
    this.mouseup = function(ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  // The rectangle tool.
  tools.rect = function() {
    var tool = this;
    this.started = false;

    this.mousedown = function(ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function(ev) {
      if (!tool.started) {
        return;
      }

      var x = Math.min(ev._x, tool.x0),
        y = Math.min(ev._y, tool.y0),
        w = Math.abs(ev._x - tool.x0),
        h = Math.abs(ev._y - tool.y0);

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (!w || !h) {
        return;
      }

      context.strokeRect(x, y, w, h);
    };

    this.mouseup = function(ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  // The line tool.
  tools.line = function() {
    var tool = this;
    this.started = false;

    this.mousedown = function(ev) {
      tool.started = true;
      tool.x0 = ev._x;
      tool.y0 = ev._y;
    };

    this.mousemove = function(ev) {
      if (!tool.started) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.moveTo(tool.x0, tool.y0);
      context.lineTo(ev._x, ev._y);
      context.stroke();
      context.closePath();
    };

    this.mouseup = function(ev) {
      if (tool.started) {
        tool.mousemove(ev);
        tool.started = false;
        img_update();
      }
    };
  };

  init();

}



function getCanvasContent() {

  var canvas = document.getElementById('imageView');
  var numSteps = canvas.width,
    numOscillators = canvas.height;
  var context = canvas.getContext('2d');

  var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  //var imageData = resizeImageData2(imageDataOrig, numSteps, numOscillators);
  var data = imageData.data;


  var steps = [];
  // iterate over all pixels based on x and y coordinates
  for (var x = 0; x < numSteps; x++) {
    var step = [];
    steps.push(step);
    // loop through each column
    for (var y = 0; y < numOscillators; y++) {
      var red = data[((numSteps * y) + x) * 4];
      var green = data[((numSteps * y) + x) * 4 + 1];
      var blue = data[((numSteps * y) + x) * 4 + 2];
      var alpha = data[((numSteps * y) + x) * 4 + 3];
      step.push(alpha);
    }
  }

  console.log(steps);

  return steps;
}

// from http://stackoverflow.com/questions/3448347/how-to-scale-an-imagedata-in-html-canvas

function resizeImageData(c, imageData, width, height) {
  var scaled = c.createImageData(width, height);

  for (var row = 0; row < imageData.height; row++) {
    for (var col = 0; col < imageData.width; col++) {
      var sourcePixel = [
        imageData.data[(row * imageData.width + col) * 4 + 0],
        imageData.data[(row * imageData.width + col) * 4 + 1],
        imageData.data[(row * imageData.width + col) * 4 + 2],
        imageData.data[(row * imageData.width + col) * 4 + 3]
      ];
      for (var y = 0; y < scale; y++) {
        var destRow = row * scale + y;
        for (var x = 0; x < scale; x++) {
          var destCol = col * scale + x;
          for (var i = 0; i < 4; i++) {
            scaled.data[(destRow * scaled.width + destCol) * 4 + i] =
              sourcePixel[i];
          }
        }
      }
    }
  }

  return scaled;
}

function resizeImageData2(imageData, width, height) {
  canvas = document.createElement('canvas');

  var context = canvas.getContext('2d');
  context.putImageData(imageData, 0, 0);

  prevCanvas = document.getElementById('previewCanvas').getContext('2d');
  //prevCanvas.webkitImageSmoothingEnabled = false;
  //prevCanvas.mozImageSmoothingEnabled = false;
  //prevCanvas.imageSmoothingEnabled = false;
  //prevCanvas.scale(width / imageData.width, height / imageData.width);
  //prevCanvas.scale(1, 2);
  prevCanvas.drawImage(context.canvas, 0, 0);

  return prevCanvas.getImageData(0, 0, width, height);
}