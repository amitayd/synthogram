'use strict';

var gapPos = 0.3;
var gapPercent = 0.5;

function drawLine(y, from, to) {
  var length = to - from;
  window.SGApi.drawNote(from, y, length);

  console.log('drawLine', y, from, to);
  var gapStart = from + Math.floor(length * gapPos);
  var gapEnd = gapStart + Math.floor(length * gapPercent);

  if (gapStart !== gapEnd) {
    drawLine(y + 1, from, gapStart);
    drawLine(y + 1, gapEnd, to);
  }
}

drawLine(0, 0, 48);