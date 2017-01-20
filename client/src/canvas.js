var settings = {
  canvas: null,       // Canvas element
  context: null,      // Canvas context
  nextObject: "pen",  // Default tool
  nextColor: "black", // Default color
  currentShape: null, // Shape currently being created by user
  shapes: [],         // All shapes on canvas, including deleted
  events: [],         // Stack that tracks all actions on shapes (create, delete, move, ...)
  undone: []          // Stack containing undone actions
};


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

    }
  });

  $(settings.canvas).mouseup(function(e) {

    if(settings.currentShape != null) {
      settings.shapes.push(settings.currentShape);
      settings.events.push( {command: "create", shapeID: settings.shapes.length-1});
    }

    settings.currentShape = null; // End any ongoing shape operations
    settings.undone = [];         // Clear undone stack since a new event occurred
  });

  $(settings.canvas).mousemove(function(e) {
    var shape = settings.currentShape;

    if(shape != null) {
      shape.setEnd(e.offsetX, e.offsetY);
      drawAll(settings.context);
      shape.draw(settings.context);
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

    $('.selected').text($(this).text());

  });

  // Sets which color will be used next
  $(".colorButtons > .btn").click(function(e) {

      var idClicked = e.target.id;
      settings.nextColor = idClicked;


      $(this).addClass("active").siblings().removeClass("active");

  });

  $(".redoButtons > .btn").click(function(e) {

      var idClicked = e.target.id;

      if(idClicked == "undoButton"){
        undo();
      }
      else if(idClicked == "redoButton"){
        redo();
      }
  });

});

function undo() {

  if(settings.events.length != 0){

    var event = settings.events.pop();

    if(event.command === "create") {
      settings.shapes[event.shapeID].deleted = true;
      settings.undone.push(event);  // move shape from active stack to undone stack
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

    var event = settings.undone.pop();  // move shape from undone back to active stack

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
 * Clear the canvas and draw every shape in settings.shapes
 * TODO color of object needs to be added to events array
 */
function drawAll(context) {
  context.clearRect(0, 0, settings.canvas.width, settings.canvas.height); //so the line follows the mouse and redraws itself on every mousemove

  for(var i = 0; i < settings.shapes.length; i++) {
    var shape = settings.shapes[i];
    if(!shape.deleted) {
      shape.draw(context);
    }
  }
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
    this.endX = x;
    this.endY = y;
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
  }

  // Draw the circle
  // Centers on start coordinates, sets radius to distance from start to end
  // Could be modified to center on a midpoint between the two
  draw(context) {
    var dX = this.endX - this.startX;
    var dY = this.endY - this.startY;
    var radius = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));  //square root of dX squared + dY squared. Pythagoras.

    context.beginPath();
    context.arc(this.startX, this.startY, radius, 0, 2*Math.PI, false);
    context.strokeStyle = this.color;
    context.stroke();
  }
}
