var appVars = {
  canvasDimensions: null,
  context: null,          // Canvas context, loaded by commands.js
  shapes: [],             // All shapes on canvas, including deleted
  events: [],             // Stack that tracks all actions on shapes (create, delete, move, ...)
  undone: [],             // Stack containing undone actions
  selected: []            // IDs of all selected shapes
};

function deselectAll() {
  appVars.selected = [];
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
      if(!shape.selected) {
        appVars.selected.push(i);
        shape.selected = true;
      }
      return true;  // Something was selected
    }
  }
  return false;
}

/**
 * Clear the canvas and draw every shape in appVars.shapes
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

// Calculate gap between two points
function calcGap(start, end) {
  let dx = end.x - start.x;
  let dy = end.y - start.y;
  return {
    x: dx,
    y: dy
  };
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
      let start = {x: event.from.x, y: event.from.y};
      let end = {x: event.to.x, y: event.to.y};
      let offset = calcGap(end, start); // flipped start & end

      for(let i = 0; i < event.shapeIDs.length; i++) {
        let id = event.shapeIDs[i];
        appVars.shapes[id].move(offset.x, offset.y);
      }
      appVars.undone.push(event);
    }
  }

  drawAll();  // redraw canvas
}

function redo() {

  if(appVars.undone.length != 0) {
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
      let start = {x: event.from.x, y: event.from.y};
      let end = {x: event.to.x, y: event.to.y};
      let offset = calcGap(start, end);

      for(let i = 0; i < event.shapeIDs.length; i++) {
        let id = event.shapeIDs[i];
        appVars.shapes[id].move(offset.x, offset.y);
      }
      appVars.events.push(event);
    }
  }

  drawAll();
}

function offsetShapes(move) {
  let start = {x: move.startX, y: move.startY};
  let end = {x:move.endX, y: move.endY};
  let offset = calcGap(start, end);

  // then reset the offsets start coordinates
  move.startX = move.endX;
  move.startY = move.endY;

  for(let i = 0; i < appVars.selected.length; i++) {
    let id = appVars.selected[i];
    let shape = appVars.shapes[id];
    shape.move(offset.x, offset.y);
  }
  drawAll();
}

// Used to add the last move to the Stack
// offsetShapes is called too often per move to do this.
function saveMove(move) {
  let shapeIDs = appVars.selected.slice();
  let event = ( {
    command: "move",
    shapeIDs: shapeIDs,
    from: {x: move.originX, y: move.originY},
    to: {x: move.endX, y: move.endY}
  });
  appVars.events.push(event);
}

function createShape(shape) {
  let shapeID = appVars.shapes.length;  // Shape ID is its ID on the shape stack for now

  deselectAll();
  shape.selected = true;          // should go out of use soon
  appVars.selected.push(shapeID); // use this instead

  appVars.shapes.push(shape);
  appVars.events.push({command: "create", shapeID: shapeID});
  appVars.undone = [];
}

function colorSelected(color) {
  for(let i = 0; i < appVars.selected.length; i++) {
    let id = appVars.selected[i];
    appVars.shapes[id].color = color;
  }

  drawAll();
}
