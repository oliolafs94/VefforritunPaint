
var eventVars = {
  canvas: null,       // Canvas element
  context: null,      // Canvas context
  nextObject: "pen",  // Default tool
  nextColor: "black", // Default color
  nextLineWidth: 1,   // Default line width
  currentShape: null, // Shape currently being created by user
  moveCoords: null,   // Track movement of a selected shape
};


$(document).ready(function () {
  eventVars.canvas = document.getElementById("myCanvas");
  eventVars.context = eventVars.canvas.getContext("2d");

  // Send information needed for drawing to the app but keep it at minimum
  appVars.canvasDimensions = { width: eventVars.canvas.width, height: eventVars.canvas.height };
  appVars.context = eventVars.context;

  $(eventVars.canvas).mousedown(function(e) {

    switch(eventVars.nextObject) {

      case("line"):
        eventVars.currentShape = new Line(e.offsetX, e.offsetY, eventVars.nextColor, eventVars.nextLineWidth);
        break;

      case("pen"):
        eventVars.currentShape = new Pen(e.offsetX, e.offsetY, eventVars.nextColor, eventVars.nextLineWidth);
        break;

      case("circle"):
        eventVars.currentShape = new Circle(e.offsetX, e.offsetY, eventVars.nextColor, eventVars.nextLineWidth);
        break;

      case("rect"):
        eventVars.currentShape = new Rect(e.offsetX, e.offsetY, eventVars.nextColor, eventVars.nextLineWidth);
        break;

      case("select"):
        if(select(e.offsetX, e.offsetY, e.ctrlKey)) {
          eventVars.moveCoords = new Move(e.offsetX, e.offsetY);
        }
        break;

      case("text"):
        var textarea = document.getElementById("textarea");

        textarea.hidden = false;
        textarea.style.position = "absolute";
        textarea.style.left = e.offsetX +"px";
        textarea.style.top = e.offsetY + "px";
        textarea.style.zIndex = eventVars.canvas.style.zIndex+1; // Places the textarea on top of the canvas
        break;
    }
  });

  $(eventVars.canvas).mouseup(function() {

    if(eventVars.currentShape !== null && eventVars.currentShape.isValid()) {
      createShape(eventVars.currentShape);
    }
    else if(eventVars.moveCoords instanceof Object && eventVars.moveCoords.isValid()) {
      saveMove(eventVars.moveCoords);
    }

    eventVars.currentShape = null; // End any ongoing shape operations
    eventVars.moveCoords = null;
    eventVars.undone = [];         // Clear undone stack since a new event occurred
  });

  $(eventVars.canvas).mousemove(function(e) {
    var shape = eventVars.currentShape;

    if(shape !== null) {
      shape.setEnd(e.offsetX, e.offsetY);
      drawAll();
      shape.draw(eventVars.context);
    }
    else if(eventVars.moveCoords !== null) {
      eventVars.moveCoords.setEnd(e.offsetX, e.offsetY);
      offsetShapes(eventVars.moveCoords);
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

    eventVars.nextObject = idClicked;

    $(".selected").text($(this).text());
  });

  // Sets which color will be used next
  $(".colorButtons > .btn").click(function(e) {
    let idClicked = e.target.id;
    eventVars.nextColor = idClicked;


    $(this).addClass("active").siblings().removeClass("active");
  });

  $(".jscolor").change(function(){
    let value = "#";
    value = value.concat($(".jscolor").val());
    eventVars.nextColor = value;

    colorSelected(value);
  });

  // sets the linewidth
  $("#linewidth").change(function() {
    let value = $("#linewidth").val();
    eventVars.nextLineWidth = value;
  });

  // sets the linewidth
  $("#fontsize").change(function() {
    let value = $("#fontsize").val();
    eventVars.nextLineWidth = value;
  });

  // calls redo or undo if the buttons are pressed
  $(".redoButtons > .btn").click(function(e) {
    let idClicked = e.target.id;

    if(idClicked == "undoButton") {
      undo();
    }
    else if(idClicked == "redoButton") {
      redo();
    }
  });

});
