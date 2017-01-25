var appVars = {
  canvasDimensions: null,
  context: null,          // Canvas context, loaded by commands.js
  shapes: [],             // All shapes on canvas, including deleted
  events: [],             // Stack that tracks all actions on shapes (create, delete, move, ...)
  undone: []              // Stack containing undone actions
};

function deselectAll() {
  for(let i = 0; i < appVars.shapes.length; i++) {
    appVars.shapes[i].selected = false;
  }
}

function select(e) {
  if(!e.ctrlKey) { // Clear selection if user is not holding ctrl
    deselectAll();
  }

  for(let i = appVars.shapes.length-1; i >= 0; i--) {  // iterate from newest to oldest shape
    let shape = appVars.shapes[i];
    if(!shape.deleted && shape.contains(e.offsetX, e.offsetY)) {
      console.log("selected " + i);
      shape.selected = true;
      return true;  // Something was selected
    }
  }
  return false;
}

/**
 * Clear the canvas and draw every shape in appVars.shapes
 * TODO color of object needs to be added to events array
 * fadsgdhfjg
 */
function drawAll() {
  let dimensions = appVars.canvasDimensions;
  appVars.context.clearRect(0, 0, dimensions.width, dimensions.height);

  for(var i = 0; i < appVars.shapes.length; i++) {
    var shape = appVars.shapes[i];
    if(!shape.deleted) {
      shape.draw(appVars.context);
    }
  }
}

function undo() {

  if(appVars.events.length != 0){

    var event = appVars.events.pop();

    if(event.command === "create") {
      appVars.shapes[event.shapeID].deleted = true;
      appVars.undone.push(event);
    }
    else if(event.command === "delete") {
      appVars.shapes[event.shapeID].deleted = false;
      appVars.undone.push(event);
    }
    else if(event.command === "move") {
      console.log("NOT IMPLEMENTED");
    }

  }

  drawAll();  // redraw canvas
}

function redo() {

  if(appVars.undone.length != 0){

    var event = appVars.undone.pop();

    if(event.command === "create") {
      appVars.shapes[event.shapeID].deleted = false;
      appVars.events.push(event);
    }
    else if(event.command === "delete") {
      appVars.shapes[event.shapeID].deleted = true;
      appVars.events.push(event);
    }
    else if(event.command === "move") {
      console.log("NOT IMPLEMENTED");
    }
  }

  drawAll();
}

function offsetShapes(move) {
  let xOffset = move.endX - move.startX;
  let yOffset = move.endY - move.startY;

  // then reset the offsets start coordinates
  // (move was copied by reference)
  move.startX = move.endX;
  move.startY = move.endY;

  for(let i = 0; i < appVars.shapes.length; i++) {
    let shape = appVars.shapes[i];
    if(shape.selected) {
      shape.move(xOffset, yOffset);
    }
  }
  drawAll(appVars.context);
}

function createShape(shape) {
  appVars.shapes.push(shape);
  appVars.events.push( {command: "create", shapeID: appVars.shapes.length-1});
}
