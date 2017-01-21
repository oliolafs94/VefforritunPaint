var settings = {
  canvas: null,       // Canvas element
  context: null,      // Canvas context
  nextObject: "pen",  // Default tool
  nextColor: "black", // Default color
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
  for(let i = 0; i < settings.shapes.length; i++) {
    let shape = settings.shapes[i];
    console.log("checking " + i);
    if(shape.selected) {
      shape.move(xOffset, yOffset);
    }
  }
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
        settings.currentShape = new Line(e.offsetX, e.offsetY, settings.nextColor);
        break;

      case("pen"):
        settings.currentShape = new Pen(e.offsetX, e.offsetY, settings.nextColor);
        break;

      case("circle"):
        settings.currentShape = new Circle(e.offsetX, e.offsetY, settings.nextColor);
        break;

      case("rect"):
        settings.currentShape = new Rect(e.offsetX, e.offsetY, settings.nextColor);
        break;

      case("select"):
        if(select(e)) {
          settings.moveCoords = new Line(e.offsetX, e.offsetY);
        }
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

  $(".nav .nextbutton").click(function(e) {
    var idClicked = e.target.id;

    settings.nextObject = idClicked;
});
  //Sets which shape will be drawn next

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

function undo() {

  if(settings.events.length != 0){

    var event = settings.events.pop();

    if(event.command === "create") {
      settings.shapes[event.shapeID].deleted = true;
      settings.undone.push(event);          // move shape from active stack to undone stack
    }
    else if(event.command === "delete") {
      settings.shapes[event.shapeID].deleted = false;
      settings.undone.push(event);
    }
    else if(event.command === "move") {
      console.log("NOT IMPLEMENTED")
    }

  }

  drawAll(settings.context);              // redraw canvas
}

function redo() {

  if(settings.undone.length != 0){

    var event = settings.undone.pop();                     // move shape from undone back to active stack

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
/**
Base shape object used for inheritance by all specific canvas shapes
Contains start coordinates, end coordinates, color and a soft deletion flag
**/
class Shape {

  // Takes starting x & y coordinates and shape color
  // Additionally keeps track of soft deletion and possible end coordinates
  constructor(x, y, color) {
    this.startX = x;
    this.startY = y;
    this.color = color;
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
}

/**
Rectangle shape
Uses standard color, start and end coordinate behavior from super
Uses own draw function
**/
class Rect extends Shape {
  constructor(x, y, color) {
    super(x, y, color);
  }

  draw(context) {
    context.strokeStyle = this.color;
    context.strokeRect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
  }

  // Checks whether or not the given coordinates are within the square
  contains(x, y) {
    let withinX = this.startX <= x && this.endX >= x;  // x is on rect length
    let withinY = (this.startY <= y && this.endY >= y);  // y is on rect height
    return withinX && withinY;
  }

  move(x, y) {
    console.log(x + " " + y);
  }
}

/**
Line shape
Uses standard color, start and end coordinate behavior from super
Uses own draw function
**/
class Line extends Shape {
  constructor(x, y, color) {
    super(x, y, color);
  }

  draw(context) {
    context.beginPath();
    context.moveTo(this.startX, this.startY);
    context.lineTo(this.endX, this.endY);
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
  constructor(x, y, color) {
    super(x, y, color);
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
    context.strokeStyle = this.color;
    context.stroke();
  }
}


class Circle extends Shape {
  constructor(x, y, color) {
    super(x, y, color);
    this.radius = null;
  }

  // Draw the circle
  // Centers on start coordinates, sets radius to distance from start to end
  // Could be modified to center on a midpoint between the two
  draw(context) {
    let dX = this.endX - this.startX;
    let dY = this.endY - this.startY;
    this.radius = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));  //square root of dX squared + dY squared. Pythagoras.

    context.beginPath();
    context.arc(this.startX, this.startY, this.radius, 0, 2*Math.PI, false);
    context.strokeStyle = this.color;
    context.stroke();
  }

  // Checks whether or not the given coordinates are within the square
  // is the distance from center to coord less than the radius?
  contains(x, y) {
    let dX = x - this.startX;
    let dY = y - this.startY;
    let dist = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    return dist <= this.radius;
  }
}
