
var eventVars = {
  canvas: null,       // Canvas element
  context: null,      // Canvas context
  nextObject: "pen",  // Default tool
  nextColor: "black", // Default color
  nextLineWidth: 5,   // Default line width
  nextFontSize: 18,   // Default font size
  textArea: null,
  currentShape: null, // Shape currently being created by user
  moveCoords: null   // Track movement of a selected shape
};


$(document).ready(function () {
  eventVars.canvas = document.getElementById("myCanvas");
  eventVars.context = eventVars.canvas.getContext("2d");
  eventVars.textArea = document.getElementById("textarea");

  getDrawingIDs();

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
        var textarea = eventVars.textArea;
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

    if(e.which == 13) { // Enter was pressed
      let textArea = eventVars.textArea;
      if(textArea instanceof Object && textArea.hidden === false) {

        // Still include "px"
        let x = textArea.style.left;
        let y = textArea.style.top;

        // Get rid of "px"
        x = Number(x.slice(0, x.length-2));
        y = Number(y.slice(0, y.length-2));

        let shape = new TextBox(x, y, eventVars.nextColor, eventVars.nextFontSize, textArea.value);
        textArea.hidden = true;
        textArea.value = "";
        createShape(shape);
        drawAll();
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

    colorSelected(idClicked);
  });

  $(".jscolor").change(function(){
    let value = "#";
    value = value.concat($(".jscolor").val());
    eventVars.nextColor = value;

    colorSelected(value);
  });

  // sets the linewidth
  $(".linewidth").change(function() {
    let value = $(".linewidth").val();
    eventVars.nextLineWidth = value;
  });

  // sets the linewidth
  $(".fontsize").change(function() {
    let value = $(".fontsize").val();
    eventVars.nextFontSize = value;
  });

  // calls redo or undo if the buttons are pressed
  $(".redoButtons > .btn").click(function(e) {
    let idClicked = e.target.id;

    if(idClicked === "undoButton") {
      undo();
    }
    else if(idClicked === "redoButton") {
      redo();
    }
  });

  $( ".saveButton" ).submit(function() {
    let title = $("#saveInput").val();

    if(title.match(/[a-z]/i) || title.match(/\d+/g)){     // check if title contains characters
      appVars.title = title;
    }
    console.log(appVars.title);
    saveShapes();
  });

  $( ".loadButton" ).submit(function() {
    let id = $("#loadDrawing").val();
    console.log(id);
    loadDrawing(id);
  });
});
