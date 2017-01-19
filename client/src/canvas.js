//import shape from "shape.js"
var settings = {
  canvas: undefined,    // Gets set when the document is ready
  context: undefined,
  nextObject: "pen",
  nextColor: "black",
  currentShape: undefined,
  shapes: [],
  undone: []    // Stack containing undone actions
};


$(document).ready(function () {

  settings.canvas = document.getElementById("myCanvas");        // Get the canvas object now that document is ready
  settings.context = settings.canvas.getContext("2d");

  $(settings.canvas).mousedown(function(e) {

    switch(settings.nextObject) {

      case("line"):
        settings.currentShape = new Line(e.offsetX, e.offsetY);
        break;

      case("pen"):
        settings.currentShape = new Pen(e.offsetX, e.offsetY);     // start a new shape
        break;

    }
  });

  $(settings.canvas).mouseup(function(e) {
    settings.shapes.push(settings.currentShape);
    settings.currentShape = undefined;   // End any ongoing shape operations
  });

  $(settings.canvas).mousemove(function(e) {
    var shape = settings.currentShape;

    if(shape !== undefined) {
      shape.setEnd(e.offsetX, e.offsetY);
      drawAll(settings.context);
      shape.draw(settings.context);
    }
  });

  // This listener is attached to document
  $(document).keydown(function(e) {

    if(e.ctrlKey) {                                   // ctrl is held

      if(e.which == 90) {                             // z was pressed
        settings.undone.push(settings.shapes.pop());  // move shape from active stack to undone stack
        drawAll(settings.context);                    // redraw canvas
      }
      else if(e.which == 89) {                        // y was pressed
        settings.shapes.push(settings.undone.pop());  // move shape from undone back to active stack
        drawAll(settings.context);                    // redraw canvas
      }
    }
  });
});


/**
 * Clear the canvas and draw every shape in settings.shapes
 */
function drawAll(context) {
  context.clearRect(0, 0, settings.canvas.width, settings.canvas.height); //so the line follows the mouse and redraws itself on every mousemove

  for(var i = 0; i < settings.shapes.length; i++) {
    settings.shapes[i].draw(context);
  }
}

// ES5 classes
// TODO: get ES6 support so we can move these to their own files.
//       ES6 seems to be required for referencing other files.
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
