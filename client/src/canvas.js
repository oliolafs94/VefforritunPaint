var settings = {
  canvas: undefined,    // Gets set when the document is ready
  nextOjbect: "line",
  nextColor: "black",
  nextShape: undefined  // Gets set when mousedown initiates a new shape
};

$(document).ready(function () {

  settings.canvas = document.getElementById("myCanvas");        // Get the canvas object now that document is ready

  $(settings.canvas).mousedown(function(e) {
    settings.nextShape = new protoShape(e.clientX, e.clientY);  // start a new shape
  });

  $(settings.canvas).mouseup(function(e) {
    var shape = settings.nextShape;

    if(shape !== undefined) { // mousedown has started a new shape
      shape.endX = e.clientX;
      shape.endY = e.clientY;
      drawLine(shape);
    }
  })
});

function drawLine(line) {
  context = settings.canvas.getContext("2d");
  context.beginPath();                      // Start a line shape
  context.moveTo(line.startX, line.startY); // Designate starting point
  context.lineTo(line.endX, line.endY);     // Designate endpoint
  context.stroke();                         // Draw the line

  settings.nextShape = undefined;           // Line is drawn, no longer in progress
}

// Prototype shape
// Replace with standalone classes
function protoShape(x, y) {
  this.startX = x;
  this.startY = y;
};
