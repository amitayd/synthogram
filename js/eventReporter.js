/*exported  sgEventReporter */

'use strict';

function sgEventReporter(ga) {
  var sent = {};

  var hash = function (action, label, value) {
    return [action, label, value].join('|');
  };

  return {
    send: function (category, action, label, value) {
      console.log('send', 'event', category, action, label, value);
      if (ga) {
        ga('send', 'event', category, action, label, value);

      }
      sent[hash(category, action, label)] = true;
    },
    sendOnce: function (category, action, label, value) {
      if (!sent[hash(category, action, label)]) {
        this.send(category, action, label, value);
      }
    }
  };
}