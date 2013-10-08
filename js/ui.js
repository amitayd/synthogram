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

})(jQuery);