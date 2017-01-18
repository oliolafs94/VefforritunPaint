//import shape from "shape.js"
var settings = {
  canvas: undefined,    // Gets set when the document is ready
  nextOjbect: "line",
  nextColor: "black",
  nextShape: undefined  // Gets set when mousedown initiates a new shape
};


$(document).ready(function () {

  settings.canvas = document.getElementById("myCanvas");        // Get the canvas object now that document is ready

  $(settings.canvas).mousedown(function(e) {
    settings.nextShape = new Line(e.clientX, e.clientY);  // start a new shape
  });

  $(settings.canvas).mouseup(function(e) {
    var shape = settings.nextShape;

    if(shape !== undefined) { // mousedown has started a new shape
      var context = settings.canvas.getContext("2d");
      shape.endX = e.clientX;
      shape.endY = e.clientY;
      shape.draw(context);
    }
  })
});



//ES6 classes
//TODO: find a way to move them to their own files. Import isn't working.
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
    context.beginPath();                      // Start a line shape
    context.moveTo(this.startX, this.startY); // Designate starting point
    context.lineTo(this.endX, this.endY);     // Designate endpoint
    context.stroke();                         // Draw the line

    settings.nextShape = undefined;           // Line is drawn, no longer in progress
  }
}
