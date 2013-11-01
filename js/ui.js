/*exported  synthogramInit */
/*globals  jQuery, window, document*/
'use strict';

(function ($) {
  $.fn.sgKnob = function (model, eventReporter) {

    return this.each(function () {
      var element = $(this);
      var property = model.get(element.data('prop'));
      var scale = element.data('scale') || 1;
      var step = element.data('step') || 1;
      var min = element.data('min') || 1;
      var max = element.data('max') || 100;

      element.bind('change', function () {
        property.set(parseInt(element.val(), 10) / scale);
      });

      element.val(property.get() * scale);
      element.knob({
        width: element.width(),
        height: element.height(),
        fgColor: element.css('color'),
        inputColor: element.css('color'),
        thickness: 0.3,
        bgColor: element.css('backgroundColor'),
        displayPrevious: true,
        step: step,
        min: min,
        max: max,
        change: function (val) {
          // fix for the even returning values not rounded
          console.log('val', val);
          var valRounded = Math.floor(val - (val % step)) / scale;
          property.set(valRounded);
          eventReporter.sendOnce('change', 'knob', property.name);
        }
      });

      property.addChangeListener(function (value) {
        element.val(value * scale);
        element.trigger('change');
      });
    });
  };

  $.fn.sgGrid = function (xStep, yStep) {
    var canvas = $(this)[0];
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    var width = canvas.width;
    var height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    for (var x = 0; x < width; x += xStep) {
      ctx.fillRect(x, 0, 1, height);
    }
    for (var y = 0; y < height; y += yStep) {
      ctx.fillRect(0, parseInt(y, 10), width, 1);
    }
  };

  $.fn.sgGridLabels = function (yStep, legendFunc) {
    var canvas = $(this)[0];
    var height = canvas.height;

    var ctx = canvas.getContext('2d');


    ctx.fillStyle = this.css('color');
    ctx.font = this.css('font-size') + ' Calibri';

    ctx.clearRect(0, 0, canvas.width, height);

    for (var y = yStep / 2; y < canvas.height; y += yStep) {
      var legend = legendFunc(y);
      ctx.fillText(legend, 2, y + 3);
    }
  };

  $.fn.bindMobileEventsPreventMouse = function () {
    $(this).on('touchstart touchmove touchend touchcancel', function (e) {
      var event = e.originalEvent;
      var touches = event.changedTouches,
          first = touches[0],
          type = '';

      switch (event.type) {
      case 'touchstart':
        type = 'mousedown';
        event.preventDefault();
        break;
      case 'touchmove':
        type = 'mousemove';
        event.preventDefault();
        break;
      case 'touchend':
        type = 'mouseup';
        event.preventDefault();
        break;
      default:
        return;
      }

      var simulatedEvent = document.createEvent('MouseEvent'); 

      simulatedEvent.initMouseEvent(
        type, true, true, window, 1, 
        first.screenX, first.screenY, first.clientX, first.clientY, 
        false, false, false, false, 0/*left*/, null
      );

      first.target.dispatchEvent(simulatedEvent);
    });
  };

  /* create a tab in the children of the passed elements */
  $.fn.sgTab = function (eventReporter) {
    return this.each(function () {
      var tabContainer = $(this);
      var tabs = tabContainer.children('.sidecontent');
      tabContainer.on('click', '.tab-label', function () {
        var tabSelector = $(this).data('tab-selector');
        var tab = $(tabSelector);
        // hid the other tabs but this one
        tabs.not(tab).hide();
        $('.tab-label', tabContainer).removeClass('selected');
        // Show this tab
        $(this).addClass('selected');
        tab.show();
        eventReporter.send('click', 'tab', tabSelector);
      });
    });
  };

  /* create a button */
  $.fn.sgButton = function (model, eventReporter) {
    return this.each(function () {
      var button = $(this);
      var property = model.get(button.data('prop'));
      var buttonName = button.data('onclass') + '/' + button.data('offclass');

      var setValue = function () {
        var value = property.get();
        button.addClass(button.data(value ? 'onclass' : 'offclass'));
        button.removeClass(button.data(value ? 'offclass' : 'onclass'));
      };

      property.addChangeListener(function () {
        setValue();
      });

      button.on('click', function () {
        // Simply negate the current value;
        property.set(!property.get());
        eventReporter.send('click', 'button', buttonName);
      });

      //Set the initial state
      setValue();
    });
  };

  /* create a button */
  $.fn.sgButtonSet = function (model, eventReporter) {
    return this.each(function () {
      var buttonSet = $(this);
      var property = model.get(buttonSet.data('prop'));

      buttonSet.children('li').on('click', function () {
        var value = $(this).data('val');
        property.set(value);
        eventReporter.send('click', 'buttonset', value);
        // To prevent from other children being triggered
        return false;
      });

      var setValue = function () {
        var value = property.get();
        $('.selected', buttonSet).removeClass('selected');
        $('li[data-val="' + value + '"] label',buttonSet).addClass('selected');
      };

      property.addChangeListener(setValue);


      //Set the initial state
      setValue();
    });
  };

  $.fn.sgSlider = function (model, eventReporter) {
    return this.each(function () {
      var slider = $(this);
      var property = model.get(slider.data('prop'));
      var scale = Number(slider.data('scale')) || 1;
      // TODO: Not clear how to calculate the offset... I know it's 4 right now...
      var width = slider.width() - 4;
      var max = Number(slider.data('max')) || width;
      var min = Number(slider.data('min')) || 0;
      var range = max - min;
      var handleOffset = Number($('.slider-handle', slider).width()) / 2;

      var setValue = function () {
        var value = Math.floor(property.get() * scale);
        var x = (value - min) / range * width; 
        $('.fill', slider).css('width', x);
        $('.slider-handle', slider).css('left', x);
        $('.balloon', slider).text(value);
      };

      property.addChangeListener(setValue);

      var sliderChange = function (e) {
        var x = e.pageX - slider.offset().left - handleOffset;
        x = Math.min(x, width);
        var value = x / width * range + min;
        value = Math.max(value, min);
        value = Math.min(value, max);
        property.set(Math.floor(value) / scale);
      };

      var isMousedown = false;
      slider.bind('mousedown', function (e) {
        isMousedown = true;
        sliderChange(e);
        eventReporter.sendOnce('change', 'slider', property.name);
      });

      slider.bind('mouseup', function () {
        isMousedown = false;
      });

      slider.bind('mousemove', function (e) {
        if (isMousedown) {
          sliderChange(e);
        }
      });

      slider.bindMobileEvents();
      setValue();
    });
  };
})(jQuery);