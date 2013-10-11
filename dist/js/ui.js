(function($) {

  /* create a label based on an elements title and data-label attributes */
  $.fn.sgLabel = function() {
    return this.each(function() {

      var label = $("<label class='controlLabel' />");
      label.attr({
        for: $(this).attr('id'),
        title: $(this).attr('title')
      });
      label.text($(this).attr('data-label'));
      $(this).before(label);

      label.tooltip();
    });
  };


  $.fn.sgKnob = function(property, min, max, scale, step) {

    return this.each(function() {
      scale = scale || 1;
      step = step || 1;
      var element = $(this);
      element.tooltip();
      element.sgLabel();
      element.bind('change', function() {
        property.set(parseInt(element.val(), 10) / scale);
      });

      element.val(property.get() * scale);
      element.knob({
        width: 50,
        height: 50,
        fgColor: 'ffec03',
        inputColor: '#ffec03',
        thickness: 0.3,
        bgColor: '#202020',
        displayPrevious: true,
        step: step,
        min: min,
        max: max,
        change: function(val) {
          // fix for the even returning values not rounded
          var valRounded = Math.floor(val - (val % step)) / scale;
          property.set(valRounded);
        }
      });

      property.addChangeListener(function(value) {
        element.val(value * scale);
        element.trigger('change');
      });
    });
  };

  $.fn.sgDropdown = function(property, values) {
    var isInteger = (typeof property.get() === 'number');

    return this.each(function() {
      var element = $(this);
      $.each(values, function(key, value) {
        element
          .append($("<option></option>")
            .attr("value", value)
            .text(value));
      });

      element.val(property.get());
      element.bind('change', function() {
        var value = element.val();
        if (isInteger) {
          value = parseInt(value, 10);
        }
        property.set(value);
      });

      element.sgLabel();

      property.addChangeListener(function(value) {
        element.val(value);
      });
    });
  };



  // TODO: make more general
  $.fn.sgStepDurationSlider = function(property) {

    var pps = 1000 / property.get('stepDuration');
    $('#stepDuration').val(pps);
    $('#stepDurationSlider').slider({
      min: 1,
      max: 120,
      value: pps,
      orientation: 'vertical',
      change: function(event, ui) {
        $("#stepDuration").val(ui.value);
        $("#stepDuration").trigger("change");
      }
    });
    $('#stepDuration').bind('change', function() {
      property.set(1 / $(this).val() * 1000);
    });
    $('#stepDuration').bindMobileEvents();

    property.addChangeListener(function(value) {
      $('#stepDuration').val(1000 / value);
      $('#stepDurationSlider').slider('value', 1000 / value);
    });
  };

  $.fn.sgStartupTooltip = function(delayTime, displayTime) {
    return this.each(function() {
      var el = $(this);
      window.setTimeout(function() {
        console.log('open', $(this));
        el.tooltip('open');
        window.setTimeout(function() {
          console.log('close');
          el.tooltip('close');
          el.tooltip('disable');
        }, displayTime);
      }, delayTime);
    });
  };

  $.fn.sgGrid = function(xStep, yStep) {
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

  $.fn.sgGridLabels = function(yStep, legendFunc) {
    var canvas = $(this)[0];
    var height = canvas.height;

    var ctx = canvas.getContext('2d');

    
    ctx.fillStyle = this.css('color');
    ctx.font = this.css('font-size') + ' Calibri';    

    ctx.clearRect(0, 0, canvas.width, height);

    for (var y = yStep/2; y < canvas.height; y += yStep) {
      var legend = legendFunc(y);
      ctx.fillText(legend, 2, y+ 3);
    }    
  };  



})(jQuery);