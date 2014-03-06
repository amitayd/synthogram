/*exported  synthogramInit */
/*globals  window, ga, sgMainController, sgView, sgEventReporter, sgModel, CanvasSource, OscSynth, Sequencer */
'use strict';

function synthogramInit() {

  var eventReporter = sgEventReporter(ga);

  // TODO: Why is the model a function: kind of ugly
  var model = sgModel().createSynthogramModel();
  console.log(model);
  var view = sgView(model, eventReporter);
  var source = new CanvasSource(view.paintCanvas, view.overlayCanvas, model.get('numOscillators'));
  var synth = null;
  try {
    synth = new OscSynth(
      model.get('numOscillators'),
      model.get('startNote'),
      model.get('startOctave'),
      model.get('musicalScale'),
      model.get('numOctaves'),
      model.get('volume'),
      model.get('delayTime'),
      model.get('delayFeedbackGain'),
      model.get('delayWetGain'),
      model.get('waveShape'),
      model.get('isSynthPlaying')
    );
  } catch (ex) {
    // synth stays null 
  }
  var sequencer = new Sequencer(synth, source,
    model.get('stepsPerSecond'), model.get('currentStep')
  );

  var controller = sgMainController(model, view, sequencer, synth, source, eventReporter);
  controller.init();

  window.setTimeout(function() {
    /* jshint ignore:start */

  // Social share plugins

  //FB
    (function (d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=182352978632123";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
   

  //Twitter
 !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+'://platform.twitter.com/widgets.js';fjs.parentNode.insertBefore(js,fjs);}}(document, 'script', 'twitter-wjs');


  //Google plus
      (function() {
        var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
        po.src = 'https://apis.google.com/js/platform.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
      })();

  /* jshint ignore:end */

  }, 1000);
}