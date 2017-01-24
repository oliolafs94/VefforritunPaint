var settings = {
  canvas: null,       // Canvas element
  context: null,      // Canvas context
  nextObject: "pen",  // Default tool
  nextColor: "black", // Default color
  nextLineWidth: 1,  // Default line width
  currentShape: null, // Shape currently being created by user
  moveCoords: null,   // Track movement of a selected shape
  shapes: [],         // All shapes on canvas, including deleted
  events: [],         // Stack that tracks all actions on shapes (create, delete, move, ...)
  undone: []          // Stack containing undone actions
};

function select(e) {
  if(!e.ctrlKey) { // Clear selection if user is not holding ctrl
    deselectAll();
  }

  for(let i = settings.shapes.length-1; i >= 0; i--) {  // iterate from newest to oldest shape
    let shape = settings.shapes[i];
    if(!shape.deleted && shape.contains(e.offsetX, e.offsetY)) {
      console.log("selected " + i);
      shape.selected = true;
      return true;  // Something was selected
    }
  }
  return false;
}

function deselectAll() {
  for(let i = 0; i < settings.shapes.length; i++) {
    if(settings.shapes[i].selected === true) {console.log("Cleared " + i)}
    settings.shapes[i].selected = false;
  }
}

function undo() {

  if(settings.events.length != 0){

    var event = settings.events.pop();

    if(event.command === "create") {
      settings.shapes[event.shapeID].deleted = true;
      settings.undone.push(event);
    }
    else if(event.command === "delete") {
      settings.shapes[event.shapeID].deleted = false;
      settings.undone.push(event);
    }
    else if(event.command === "move") {
      console.log("NOT IMPLEMENTED")
    }

  }

  drawAll(settings.context);  // redraw canvas
}

function redo() {

  if(settings.undone.length != 0){

    var event = settings.undone.pop();

    if(event.command === "create") {
      settings.shapes[event.shapeID].deleted = false;
      settings.events.push(event);
    }
    else if(event.command === "delete") {
      settings.shapes[event.shapeID].deleted = true;
      settings.events.push(event);
    }
    else if(event.command === "move") {
      console.log("NOT IMPLEMENTED");
    }
  }

  drawAll(settings.context);
}

function offsetShapes() {
  let move = settings.moveCoords;
  let xOffset = move.endX - move.startX;
  let yOffset = move.endY - move.startY;

  // then reset the offsets start coordinates
  // (move was copied by reference)
  move.startX = move.endX;
  move.startY = move.endY;

  for(let i = 0; i < settings.shapes.length; i++) {
    let shape = settings.shapes[i];
    if(shape.selected) {
      shape.move(xOffset, yOffset);
    }
  }
  drawAll(settings.context);
}

/**
 * Clear the canvas and draw every shape in settings.shapes
 * TODO color of object needs to be added to events array
 */
function drawAll(context) {
  context.clearRect(0, 0, settings.canvas.width, settings.canvas.height);

  for(var i = 0; i < settings.shapes.length; i++) {
    var shape = settings.shapes[i];
    if(!shape.deleted) {
      shape.draw(context);
    }
  }
}

$(document).ready(function () {
  settings.canvas = document.getElementById("myCanvas");
  settings.context = settings.canvas.getContext("2d");

  $(settings.canvas).mousedown(function(e) {

    switch(settings.nextObject) {

      case("line"):
        settings.currentShape = new Line(e.offsetX, e.offsetY, settings.nextColor, settings.nextLineWidth);
        break;

      case("pen"):
        settings.currentShape = new Pen(e.offsetX, e.offsetY, settings.nextColor, settings.nextLineWidth);
        break;

      case("circle"):
        settings.currentShape = new Circle(e.offsetX, e.offsetY, settings.nextColor, settings.nextLineWidth);
        break;

      case("rect"):
        settings.currentShape = new Rect(e.offsetX, e.offsetY, settings.nextColor, settings.nextLineWidth);
        break;

      case("select"):
        if(select(e)) {
          settings.moveCoords = new Line(e.offsetX, e.offsetY);
        }
        break;

      case("text"):
        var textarea = document.getElementById("textarea");

        textarea.hidden = false;
        textarea.style.position = "absolute";
        textarea.style.left = e.offsetX +"px";
        textarea.style.top = e.offsetY + "px";
        textarea.style.zIndex = settings.canvas.style.zIndex+1; // Places the textarea on top of the canvas
        break;
    }
  });

  $(settings.canvas).mouseup(function() {

    if(settings.currentShape !== null) {
      settings.shapes.push(settings.currentShape);
      settings.events.push( {command: "create", shapeID: settings.shapes.length-1});
    }

    settings.currentShape = null; // End any ongoing shape operations
    settings.moveCoords = null;
    settings.undone = [];         // Clear undone stack since a new event occurred
  });

  $(settings.canvas).mousemove(function(e) {
    var shape = settings.currentShape;

    if(shape !== null) {
      shape.setEnd(e.offsetX, e.offsetY);
      drawAll(settings.context);
      shape.draw(settings.context);
    }
    else if(settings.moveCoords !== null) {
      settings.moveCoords.setEnd(e.offsetX, e.offsetY);
      offsetShapes();
    }
  });

  // This listener is attached to document
  $(document).keydown(function(e) {

      if(e.ctrlKey) {             // ctrl is held

        if(e.which == 90) {       // z was pressed
          undo();
        }
        else if(e.which == 89) {  // y was pressed
          redo();
        }
      }
  });

  // Sets which shape will be drawn next
  $(".dropdown-menu li a").click(function(e) {
    var idClicked = e.target.id;

    settings.nextObject = idClicked;

    $(".selected").text($(this).text());

  });

  // Sets which color will be used next
  $(".colorButtons > .btn").click(function(e) {

      var idClicked = e.target.id;
      settings.nextColor = idClicked;


      $(this).addClass("active").siblings().removeClass("active");

  });

  //sets the linewidth
  $("#linewidth").change(function(e) {

      var value = $("#linewidth").val();
      settings.nextLineWidth = value;
  });

  //calls redo or undo if the buttons are pressed
  $(".redoButtons > .btn").click(function(e) {

      var idClicked = e.target.id;

      if(idClicked == "undoButton") {
        undo();
      }
      else if(idClicked == "redoButton") {
        redo();
      }
  });

});

/**
Base shape object used for inheritance by all specific canvas shapes
Contains start coordinates, end coordinates, color and a soft deletion flag
**/
class Shape {

  // Takes starting x & y coordinates and shape color
  // Additionally keeps track of soft deletion and possible end coordinates
  constructor(x, y, color, lineWidth) {
    this.startX = x;
    this.startY = y;
    this.color = color;
    this.lineWidth = lineWidth;
    this.endX = null;
    this.endY = null;
    this.deleted = false;
  }

  setEnd(x, y) {
    if(x && y) {  // Both contain new values
      this.endX = x;
      this.endY = y;
    }
  }

  // Add the offset to every coordinate in this shape
  // Overload for shapes that have overloaded coordinate behavior
  move(x, y) {
    this.startX += x;
    this.startY += y;

    this.endX += x;
    this.endY += y;
  }

  // Should be overwritten by all shapes!
  contains() {
    let msg = "The contains(x, y) function was not overloaded!"
            + "It must be overloaded by all shapes"
    throw new Error(msg);
  }
}

/**
Rectangle shape
Uses standard color, start and end coordinate behavior from super
Uses own draw function
**/
class Rect extends Shape {
  constructor(x, y, color, lineWidth) {
    super(x, y, color, lineWidth);
  }

  draw(context) {
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    context.strokeRect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
  }

  // Checks whether or not the given coordinates are within the square
  contains(x, y) {

    // We must take into account that the end points
    // may or may not be above the start points
    let withinX = (this.startX <= x && x <= this.endX)
               || (this.startX >= x && x >= this.endX); // x is on rect length
    let withinY = (this.startY <= y && y <= this.endY)
               || (this.startY >= y && y >= this.endY); // y is on rect height

    return withinX && withinY;
  }
}

/**
Line shape
Uses standard color, start and end coordinate behavior from super
Uses own draw function
**/
class Line extends Shape {
  constructor(x, y, color, lineWidth) {
    super(x, y, color, lineWidth);
  }

  draw(context) {
    context.beginPath();
    context.moveTo(this.startX, this.startY);
    context.lineTo(this.endX, this.endY);
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.color;
    context.stroke();
  }
}

/**
Freely drawn shape using the pen tool
Uses standard color and start coordinates from super
Tracks an array of end coordinates instead of single
Uses own draw function
**/
class Pen extends Shape {
  constructor(x, y, color, lineWidth) {
    super(x, y, color, lineWidth);
    this.points = [];
  }


  // Set a new point along the pen path
  setEnd(x, y) {
    this.points.push({x:x, y:y});
  }

  // draw a line from starting point to every known point in the line path
  draw(context) {
    var from = {x:this.startX, y:this.startY};
    context.beginPath();
    context.moveTo(from.x, from.y);

    for(var i = 0; i < this.points.length; i++) {
      var to = this.points[i];
      context.lineTo(to.x, to.y);
      from = to;
    }
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.color;
    context.stroke();
  }
}


class Circle extends Shape {
  constructor(x, y, color, lineWidth) {
    super(x, y, color, lineWidth);
    this.center = null;    // center coordinates
    this.rX = null;        // x radius
    this.rY = null;        // y radius
  }

  setEnd(x, y) {
    super.setEnd(x, y);
    this.center = {
      x: (this.startX + this.endX)/2,
      y: (this.startY + this.endY)/2
    }

    this.rX = Math.abs(this.endX - this.center.x);
    this.rY = Math.abs(this.endY - this.center.y);
  }

  // Draw the circle
  // Centers on start coordinates, sets radius to distance from start to end
  // Could be modified to center on a midpoint between the two
  draw(context) {
    context.beginPath();
    context.ellipse(this.center.x, this.center.y, this.rX, this.rY, 0, 0, 2 * Math.PI);
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.color;
    context.stroke();
  }


  // Checks whether or not the given coordinates are within the circle
  contains(x, y) {

    /*
    Calculate the distance from the center as a ratio of radius.
    pdx + pdy <= 1 for all points within the ellipse.
    If they are greater that means the coordinates are farther than
    100% of the radius at that point
    */
    let pdx = Math.pow(x - this.center.x, 2) / Math.pow(this.rX, 2);
    let pdy = Math.pow(y - this.center.y, 2) / Math.pow(this.rY, 2);
    return pdx + pdy <= 1;
  }

  move(x, y) {
    super.move(x, y);
    this.center = {
      x: this.center.x + x,
      y: this.center.y + y
    }
  }
}
