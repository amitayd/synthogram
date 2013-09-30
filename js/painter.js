/* © 2009 ROBO Design
 * http://www.robodesign.ro
 */

// Keep everything in anonymous function, called on window load.
var painterConfig = {
  lineWidth: 1,
  alpha: 1,
};


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
    var tool_select = document.getElementById('drawingTool');
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
    canvas.addEventListener('touchstart', ev_canvas, false);
    canvas.addEventListener('touchend', ev_canvas, false);
    canvas.addEventListener('touchmove', ev_canvas, false);
  }

  function startTool() {
    context.lineWidth = painterConfig.lineWidth;
    //context.fillStyle = "rgba(0,0,0, " + painterConfig.alpha + ")";
    context.globalAlpha = painterConfig.alpha;
  }

  // The general-purpose event handler. This function just determines the mouse 
  // position relative to the canvas element.

  function ev_canvas(ev) {
    if (ev.touches) { // Touch event
      if (ev.touches.length) {
        var offset = $(canvas).offset();
        ev._x = ev.touches[0].clientX - offset.left;
        ev._y = ev.touches[0].clientY - offset.top;
      } else {
        ev._x = null;
        ev._y = null;
      }
      // touchend is not called in chrome android when not doing this...
      ev.preventDefault();
    } else if (ev.layerX || ev.layerX == 0) { // Firefox
      ev._x = ev.layerX;
      ev._y = ev.layerY;
    } else if (ev.offsetX || ev.offsetX == 0) { // Opera
      ev._x = ev.offsetX;
      ev._y = ev.offsetY;
    }


    // convert touch events to mouse events
    var touchToMouse = {
      'touchstart': 'mousedown',
      'touchend': 'mouseup',
      'touchmove': 'mousemove'
    };



    var type = touchToMouse[ev.type] || ev.type;

    // Call the event handler of the tool.
    var func = tool[type];
    if (func) {
      func(ev);
    }
  }

  // The event handler for any changes made to the tool selector.

  function ev_tool_change(ev) {
    console.log(ev);
    if (tools[ev.target.value]) {
      tool = new tools[ev.target.value]();
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
      startTool();
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
        if (ev._x !== null) {
          tool.mousemove(ev);
        }
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
      startTool()
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
        if (ev._x !== null) {
          tool.mousemove(ev);
        }
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
      startTool();
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
      context.moveTo(tool.x0 + 0.5, tool.y0);
      context.lineTo(ev._x + 0.5, ev._y);
      context.stroke();
      context.closePath();
    };

    this.mouseup = function(ev) {
      if (tool.started) {
        if (ev._x !== null) {
          tool.mousemove(ev);
        }
        tool.started = false;
        img_update();
      }
    };
  };

  // The drawing pencil.
  tools.sharpPencil = function() {
    var tool = this;
    this.started = false;

    // This is called when you start holding down the mouse button.
    // This starts the pencil drawing.
    this.mousedown = function(ev) {
      startTool();
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


  init();

}

function clearCanvas() {
  var canvas = document.getElementById('imageView');
  var context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height)
}