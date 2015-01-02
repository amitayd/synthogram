var canvas = $('.wPaint-canvas')[0];
var ctx = canvas.getContext('2d');


var trgs = [];
var dim = ctx.canvas.width;

var trg = {
  c: "black",
  ly: canvas.height,
  lx: 0,
  ry: canvas.height,
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

  ctx.beginPath();
  ctx.moveTo(t.lx, t.ly);
  ctx.lineTo(t.rx, t.ry);
  ctx.lineTo(t.tx, t.ty);
  ctx.lineTo(t.lx, t.ly);

  ctx.fillStyle = t.c;

  ctx.fill();
  ctx.closePath();

};


fractal_iteration();
fractal_iteration();
fractal_iteration();