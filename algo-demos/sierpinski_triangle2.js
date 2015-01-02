var canvas = SGApi.getCanvas();
var ctx = SGApi.getCanvasContext();


var trgs = [];
var dim = SGApi.getNumSteps();

var trg = {
  c: "black",
  ly: SGApi.getNumNotes(),
  lx: 0,
  ry: SGApi.getNumNotes(),
  rx: dim,
  ty: 0, //canvas.height - (Math.sqrt(3) * dim) / 2,
  tx: dim / 2,
  di: dim
};

trgs.push(trg);

function fractal_iteration() {

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (var i in trgs) {

    // for each black triangle...
    if (trgs[i].c == "black") {

      // ... make one white...
      var trg = {
        c: "white",
        ly: (trgs[i].ly + trgs[i].ty) / 2,
        lx: (trgs[i].lx + trgs[i].tx) / 2,
        ry: (trgs[i].ry + trgs[i].ty) / 2,
        rx: (trgs[i].rx + trgs[i].tx) / 2,
        ty: trgs[i].ty + (Math.sqrt(3) * trgs[i].di) / 2,
        tx: trgs[i].tx,
        di: trgs[i].di / 2
      };

      trgs.push(trg);

      // ... and three blacks!

      // (first one, on the top)
      var trg = {
        c: "black",
        ly: (trgs[i].ly + trgs[i].ty) / 2,
        lx: (trgs[i].lx + trgs[i].tx) / 2,
        ry: (trgs[i].ry + trgs[i].ty) / 2,
        rx: (trgs[i].rx + trgs[i].tx) / 2,
        ty: trgs[i].ty,
        tx: trgs[i].tx,
        di: trgs[i].di / 2
      };

      trgs.push(trg);

      // (second one, on the left)
      var trg = {
        c: "black",
        ly: trgs[i].ly,
        lx: trgs[i].lx,
        ry: (trgs[i].ry + trgs[i].ly) / 2,
        rx: (trgs[i].rx + trgs[i].lx) / 2,
        ty: (trgs[i].ty + trgs[i].ly) / 2,
        tx: (trgs[i].tx + trgs[i].lx) / 2,
        di: trgs[i].di / 2
      };

      trgs.push(trg);


      // (third one, on the right)
      var trg = {
        c: "black",
        ly: (trgs[i].ly + trgs[i].ry) / 2,
        lx: (trgs[i].lx + trgs[i].rx) / 2,
        ry: trgs[i].ry,
        rx: trgs[i].rx,
        ty: (trgs[i].ty + trgs[i].ry) / 2,
        tx: (trgs[i].tx + trgs[i].rx) / 2,
        di: trgs[i].di / 2
      };

      trgs.push(trg);


    } // if "black"


  }



  // draw trgs
  for (i in trgs) {
    drawTrg(trgs[i]);
  }


};



function drawTrg(t) {
  var lineX = Math.floor(t.lx);
  var lineY = Math.floor(t.ly);
  var lineLength = Math.floor(t.rx - t.lx);

  window.SGApi.drawNote(lineX, lineY, lineLength, t.color);
  window.SGApi.drawNote(Math.floor(t.tx), Math.floor(t.ty), 1, t.color);
};


fractal_iteration();
fractal_iteration();
fractal_iteration();