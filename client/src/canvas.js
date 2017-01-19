//import shape from "shape.js"
var settings = {
  canvas: undefined,    // Gets set when the document is ready
  context: undefined,
  nextObject: "line",
  nextColor: "black",
  nextShape: undefined  // Gets set when mousedown initiates a new shape
};


$(document).ready(function () {

  settings.canvas = document.getElementById("myCanvas");        // Get the canvas object now that document is ready
  settings.context = settings.canvas.getContext("2d");

  $(settings.canvas).mousedown(function(e) {
    switch(settings.nextObject) {
      case("line"):
        settings.nextShape = new Line(e.offsetX, e.offsetY);
        break;

      case("pen"):
        settings.nextShape = new Pen(e.offsetX, e.offsetY);  // start a new shape
        break;

    }
  });

  $(settings.canvas).mouseup(function(e) {
    settings.nextShape = undefined;   // End any ongoing shape operations
  });

  $(settings.canvas).mousemove(function(e) {
    var shape = settings.nextShape;

    if(shape !== undefined) {
      shape.setEnd(e.offsetX, e.offsetY);
      settings.context.clearRect(0, 0, settings.canvas.width, settings.canvas.height); //so the line follows the mouse and redraws itself on every mousemove
      shape.draw(settings.context);
    }
  });
});



// ES5 classes
// TODO: get ES6 support so we can move these to their own files.
//       ES6 seems to be required for referencing other files.
//       Could use babel
class Shape {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.endX = undefined;
    this.endY = undefined;
  }

  setEnd(x, y) {
    this.endX = x;
    this.endY = y;
  }
}


class Line extends Shape {
  constructor(x, y) {
    super(x, y);
  }

  draw(context) {
    context.beginPath();
    context.moveTo(this.startX, this.startY);
    context.lineTo(this.endX, this.endY);
    context.stroke();
  }
}

class Pen extends Shape {
  constructor(x, y) {
    super(x, y);
    this.points = [];
  }

  /**
   * Set a new point along the pen path
   */
  setEnd(x, y) {
    this.points.push({x:x, y:y});
  }

  /**
   * draw a line from starting point to every known point in the line path
   */
  draw(context) {
    var from = {x:this.startX, y:this.startY};
    context.beginPath();
    context.moveTo(from.x, from.y);

    for(var i = 0; i < this.points.length; i++) {
      var to = this.points[i];
      context.lineTo(to.x, to.y);
      from = to;
    }
    context.stroke();
  }
}
