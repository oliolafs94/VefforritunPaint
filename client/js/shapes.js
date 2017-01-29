/**
Base shape object used for inheritance by all specific canvas shapes
Contains start coordinates, end coordinates, color and a soft deletion flag
**/
class Shape {

  // Takes starting x & y coordinates and shape color
  constructor(x, y, color, lineWidth) {
    this.startX = x;
    this.startY = y;
    this.color = color;
    this.lineWidth = Number(lineWidth);
    this.endX = null;
    this.endY = null;
    this.deleted = false;
    this.selected = false;
  }

  setEnd(x, y) {
    this.endX = x;
    this.endY = y;
  }

  // Add the offset to every coordinate in this shape
  // Overload for shapes that have overloaded coordinate behavior
  move(x, y) {
    this.startX += x;
    this.startY += y;

    this.endX += x;
    this.endY += y;
  }

  // Checks whether or not the given coordinates are within a square area
  contains(x, y) {

    // We must take into account that the end points
    // may or may not be above the start points
    let withinX = (this.startX <= x && x <= this.endX)
               || (this.startX >= x && x >= this.endX); // x is on rect length
    let withinY = (this.startY <= y && y <= this.endY)
               || (this.startY >= y && y >= this.endY); // y is on rect height

    return withinX && withinY;
  }

  // Checks for any null coordinates
  isValid() {
    let points = [this.startX, this.startY, this.endX, this.endY];
    let length = points.length,
        valid  = true,
        i = 0;
    for(i, length; i < length; i++) {
      if(typeof points[i] !== "number") { // Use typeof instead of null comparisons when possible
        valid = false;
      }
    }
    return valid;
  }

  revive(mystery) {
    this.setEnd(mystery.endX, mystery.endY);
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
    this.type = "Rect";
  }

  draw(context) {
    context.strokeStyle = this.color;
    context.lineWidth = this.lineWidth;
    context.strokeRect(this.startX, this.startY, this.endX - this.startX, this.endY - this.startY);
  }
}

class TextBox extends Rect {
  constructor(x, y, color, fontSize, text) {
    super(x, y, color, 0);
    this.endX = this.startX + (text.length*(fontSize/2));
    this.endY = this.startY - fontSize;
    this.fontSize = fontSize;
    this.font = "Arial";
    this.text = text;
    this.type = "TextBox";
  }

  draw(context) {
    context.strokeStyle = this.color;
    context.font = this.fontSize + "px " + this.font;
    context.fillText(this.text, this.startX, this.startY);
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
    this.type = "Line";
  }

  draw(context) {
    context.beginPath();
    context.moveTo(this.startX, this.startY);
    context.lineTo(this.endX, this.endY);
    context.lineWidth = this.lineWidth;
    context.strokeStyle = this.color;
    context.stroke();
  }

  /**
  Make a linear function describing the line. Put the click x coord into it and
  see if the result is close to the real click y coord.
  **/
  contains(x, y) {

    // Don't take the offset from (0, 0) into account
    x = x - this.startX;
    y = y - this.startY;

    let dx = this.endX - this.startX;
    let dy = this.endY - this.startY;
    let slope = dy/dx;

    let resultY = x*slope;
    let dist = Math.abs(resultY - y);

    return dist < (10 + this.lineWidth);
  }
}

/**
Used for keeping track of dragging movements on the canvas
so shapes can be moved around
**/
class Move extends Line {

  /**
  The move line needs to set its starting points to its end points in every drawn move
  for the movement behavior we want.
  Since the starting points are lost we must remember where the origin was in order to
  undo moves
  **/
  constructor(x, y) {
    super(x, y);

    this.originX = x;
    this.originY = y;
    this.type = "Move";
  }
}

/**
Freely drawn shape using the pen tool
**/
class Pen extends Shape {
  constructor(x, y, color, lineWidth) {
    super(x, y, color, lineWidth);
    this.points = [];
    this.type = "Pen";
  }


  // Set a new point along the pen path
  setEnd(x, y) {
    this.endX = x;
    this.endY = y;
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

  contains(x, y) {
    for(let i = 0; i < this.points.length; i++) {
      let point = this.points[i];
      let dx = point.x - x;
      let dy = point.y - y;
      let dist = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
      if(dist < 10 + this.lineWidth) {
        return true;
      }
    }
    return false;
  }

  move(x, y) {
    super.move(x, y);
    for(let i = 0; i < this.points.length; i++) {
      this.points[i].x += x;
      this.points[i].y += y;
    }
  }

  revive(mystery) {
    for(let i = 0; i < mystery.points.length; i++) {
      this.setEnd(mystery.points[i].x, mystery.points[i].y);
    }
  }
}

/**
Ellipse shape
**/
class Circle extends Shape {
  constructor(x, y, color, lineWidth) {
    super(x, y, color, lineWidth);
    this.center = null;    // center coordinates
    this.rX = null;        // x radius
    this.rY = null;        // y radius
    this.type = "Circle";
  }

  setEnd(x, y) {
    super.setEnd(x, y);
    this.center = {
      x: (this.startX + this.endX)/2,
      y: (this.startY + this.endY)/2
    };

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
    };
  }

  revive(mystery) {
    this.setEnd(mystery.endX, mystery.endY);
  }
}
