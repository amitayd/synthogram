(function($) {

  // setup menu
  $.fn.wPaint.menus.main.items.note = {
    icon: 'activate',
    title: 'Note',
    img: '../../css/note-icon.png',
    index: 0,
    callback: function() {
      this.setMode('Note');
    }
  };

  // extend defaults
  $.extend($.fn.wPaint.defaults, {
    snapGridVertical: 5, // current font size for text input
    snapGridHorizontal: 10, // active font family for text input
  });

  // extend functions
  $.fn.wPaint.extend({
    /****************************************
     * bucket
     ****************************************/
    _drawNoteDown: function(e) {
      var width = this.options.snapGridHorizontal,
        height = this.options.snapGridVertical;
      var x = e.pageX - (e.pageX % width);
      var y = e.pageY - (e.pageY % height);

      var fixedHeight = Math.floor(y + height - Math.floor(y));


      //this.ctx.fillRect(x+1, y+1, width-2, height-2);
      this.ctx.strokeStyle = this.options.strokeStyle;
      this.ctx.fillStyle = this.options.strokeStyle;
      //this.ctx.fillRect(x, y, width, height);
      this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(width), fixedHeight);
      console.log('draw note', Math.floor(x), Math.floor(y), Math.floor(width), fixedHeight, width, height);
    },
    _drawNoteMove: function(e) {
      this._drawNoteDown(e);
    },
    _drawNoteUp: function() {
      this._addUndo();
    }       

  });
})(jQuery);