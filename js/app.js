/*exported  synthogramInit */
/*globals  ga, sgMainController, sgView, sgEventReporter, sgModel, CanvasSource, OscSynth, Sequencer */
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
}