var appVars = {
  canvasDimensions: null,
  context: null,          // Canvas context, loaded by commands.js
  title: "drawing",
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

function select(x, y, ctrlHeld) {
  if(!ctrlHeld) { // Clear selection if user is not holding ctrl
    deselectAll();
  }

  for(let i = appVars.shapes.length-1; i >= 0; i--) {  // iterate from newest to oldest shape
    let shape = appVars.shapes[i];
    if(!shape.deleted && shape.contains(x, y)) {
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
    else if(event.command === "color") {

      for(let i = 0; i < event.colored.length; i++) {
        let id = event.colored[i].shapeID;
        let shape = appVars.shapes[id];
        shape.color = event.colored[i].oldColor;

        appVars.undone.push(event);
      }
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
    else if(event.command === "color") {

      for(let i = 0; i < event.colored.length; i++) {
        let id = event.colored[i].shapeID;
        let shape = appVars.shapes[id];
        shape.color = event.colored[i].newColor;

        appVars.events.push(event);
      }
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

  // Only save the move if the cursor actually moved
  if(event.from.x !== event.to.x && event.from.y !== event.to.y) {
    appVars.events.push(event);
  }
}

function createShape(shape) {
  let shapeID = appVars.shapes.length;  // Shape ID is its ID on the shape stack for now

  deselectAll();

  appVars.shapes.push(shape);
  appVars.events.push({command: "create", shapeID: shapeID});
  appVars.undone = [];

}

// Colors all selected symbols and stores it as a single evnt for all colored shapes
// That way we can undo all symbols colored by one action in one undo action
function colorSelected(color) {
  let colored = []; // Keep all colored symbols in one variable

  for(let i = 0; i < appVars.selected.length; i++) {
    let id = appVars.selected[i];
    let shape = appVars.shapes[id];
    let change = {  // Each color change is kept seperate, because old colors are different
      shapeID: id,
      newColor: color,
      oldColor: shape.color
    };
    colored.push(change);
    shape.color = color;
  }

  appVars.events.push({command: "color", colored:colored}); // Push all changes as a single color event

  drawAll();
}
