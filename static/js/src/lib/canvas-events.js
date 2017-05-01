var Constants = require("./constants.js");
var Main = require("./main.js");
var fabric = require("fabric-webpack").fabric;
var $ = require("jquery");
var Vue = require("vue");
var FastSet = require("collections/fast-set");

var hline1, hline2, vline, startComponentId;
var initialX, initialY;
var mouseDownTime;
var isDrawingFromInput = false, isDrawingFromOutput = false, creatingLine = false, isDeleting = false;
var selectableIndicator = [];

var propagateInputMovement = function (dx, dy, element, depth, prevX, prevY, vis) {
  if (depth == 2 || !element)
    return;
  if (vis.has(parseInt(element.id)))
    return;
  vis.add(parseInt(element.id));
  for (var i = 0; i < element.inputs.length; i++) {
    var input = Main.objects[element.inputs[i].id];
    var nextPrevX = input.element.x2;
    var nextPrevY = input.element.y2;
    if (input.type == Constants.TYPES.HORIZONTAL_LINE) {
      if (Math.abs(input.element.x2 - prevX) < Constants.EPS) {
        input.element.set({
          y1: input.element.y1 + dy,
          y2: input.element.y2 + dy,
          x2: input.element.x2 + dx
        });
        input.element.setCoords();
      } else {
        input.element.set({
          y1: input.element.y1 + dy,
          y2: input.element.y2 + dy,
          x1: input.element.x1 + dx
        });
        input.element.setCoords();
      }
    }
    else if (input.type == Constants.TYPES.VERTICAL_LINE) {
      if (Math.abs(input.element.y2 - prevY) < Constants.EPS) {
        input.element.set({
          y2: input.element.y2 + dy
        });
        input.y1 = input.element.y1;
        input.y2 = input.element.y2;
        input.element.setCoords();
      } else {
        input.element.set({
          y1: input.element.y1 + dy
        });
        input.y1 = input.element.y1;
        input.y2 = input.element.y2;
        input.element.setCoords();
      }
    }
    propagateInputMovement(dx, dy, input, depth + 1, nextPrevX, nextPrevY, vis);
  }
};

var propagateOutputMovement = function (dx, dy, element, depth, prevX, prevY, vis) {
  if (depth == 2 || !element)
    return;
  if (vis.has(parseInt(element.id)))
    return;
  vis.add(parseInt(element.id));
  for (var i = 0; i < element.outputs.length; i++) {
    var output = Main.objects[element.outputs[i]];
    var nextPrevX = output.element.x2;
    var nextPrevY = output.element.y2;
    if (output.type == Constants.TYPES.HORIZONTAL_LINE) {
      if (Math.abs(output.element.x2 - prevX) < Constants.EPS) {
        output.element.set({
          y1: output.element.y1 + dy,
          y2: output.element.y2 + dy,
          x2: output.element.x2 + dx
        });
        output.element.setCoords();
      } else {
        output.element.set({
          y1: output.element.y1 + dy,
          y2: output.element.y2 + dy,
          x1: output.element.x1 + dx
        });
        output.element.setCoords();
      }
    } else if (output.type == Constants.TYPES.VERTICAL_LINE) {
      if (Math.abs(output.element.y2 - prevY) < Constants.EPS) {
        output.element.set({
          y2: output.element.y2 + dy
        });
        output.y1 = output.element.y1;
        output.y2 = output.element.y2;
        output.element.setCoords();
      } else {
        output.element.set({
          y1: output.element.y1 + dy
        });
        output.y1 = output.element.y1;
        output.y2 = output.element.y2;
        output.element.setCoords();
      }
    }
    propagateOutputMovement(dx, dy, output, depth + 1, nextPrevX, nextPrevY, vis);
  }
};

var getInputId = function (id) {
  var ids = [];

  for (var key in Main.objects)
    if (Main.objects[key].type == Constants.TYPES.INPUT_GATE)
      ids.push(Main.objects[key].id);

  ids.sort();

  for (var i = 0; i < ids.length; i++)
    if (ids[i] == id)
      return String.fromCharCode(65 + i);
};

var getOutputId = function (id) {
  var ids = [];

  for (var key in Main.objects)
    if (Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
      ids.push(Main.objects[key].id);

  ids.sort();

  for (var i = 0; i < ids.length; i++)
    if (ids[i] == id)
      return String.fromCharCode(88 + i);
};

var removeObject = function (element, depth) {
  if (!element || !element.element || (depth != 0 && Main.isGate(element.type)))
    return;

  for (var i = element.inputs.length - 1; i >= 0; i--) {
    var nextInputElement = Main.objects[element.inputs[i].id];
    var index = nextInputElement.outputs.indexOf(element.id);
    nextInputElement.outputs.splice(index, 1);
  }
  for (var i = element.outputs.length - 1; i >= 0; i--) {
    var nextOutputElement = Main.objects[element.outputs[i]];
    var index = nextOutputElement.inputs.findIndex(obj => obj.id == element.id);
    nextOutputElement.inputs.splice(index, 1);
  }

  var id = element.id;
  Main.canvas.remove(element.element);
  Vue.delete(Main.objects, element.id);

  for (var key in Main.objects) {
    var curr = Main.objects[key];
    for (var i = 0; i < curr.outputs.length; i++) {
      console.assert(curr.outputs[i] != id, "SHOULD NOT CONTAIN ELEMENT " + id);
      console.assert(Main.objects[curr.outputs[i]], "SHOULD EXIST" + curr.outputs[i]);
    }
    for (var i = 0; i < curr.inputs.length; i++) {
      console.assert(curr.inputs[i].id != id, "SHOULD NOT CONTAIN ELEMENT " + id);
      console.assert(Main.objects[curr.inputs[i].id], "SHOULD EXIST " + curr.inputs[i].id);
    }

  }

  if (depth >= 0) {
    for (var i = element.inputs.length - 1; i >= 0; i--) {
      var nextInputElement = Main.objects[element.inputs[i].id];
      removeObject(nextInputElement, depth + 1);
    }
  }

  if (depth <= 0) {
    for (var i = element.outputs.length - 1; i >= 0; i--) {
      var nextOutputElement = Main.objects[element.outputs[i]];
      removeObject(nextOutputElement, depth - 1);
    }
  }

};

var getCustomGateConnection = function (key, x, y) {
  var obj = Main.objects[key].element;
  var inputGap = 50 / (Main.objects[key].inputLength + 1);
  var outputGap = 50 / (Main.objects[key].outputLength + 1);

  // checking if touching input
  for (var i = 0; i < Main.objects[key].inputLength; i++) {
    var centerX = obj.left;
    var centerY = obj.top + inputGap * (i + 1);
    var connected = centerX - 10 <= x && x <= centerX && centerY - inputGap / 2 <= y && y <= centerY + inputGap / 2;

    if (connected) {
      return {
        type: "input",
        centerX: centerX,
        centerY: centerY,
        index: i
      };
    }
  }

  // checking if touching output
  for (var i = 0; i < Main.objects[key].outputLength; i++) {
    var centerX = obj.left + 50;
    var centerY = obj.top + outputGap * (i + 1);
    var connected = centerX <= x && x <= centerX + 10 && centerY - outputGap / 2 <= y && y <= centerY + outputGap / 2;

    if (connected) {
      return {
        type: "output",
        centerX: centerX,
        centerY: centerY,
        index: i
      };
    }
  }

  return {
    type: "none"
  };
};

var getGateConnection = function (key, x, y) {
  var obj = Main.objects[key].element;
  var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + 50;
  var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

  if (connectedOutput && Main.objects[key].type != Constants.TYPES.OUTPUT_GATE && Main.isGate(Main.objects[key].type)) {
    var centerX = obj.left + 50;
    var centerY = obj.top + 25;
    return {
      type: "output",
      centerX: centerX,
      centerY: centerY,
      index: 0
    };
  } else if (connectedInput && Main.objects[key].type != Constants.TYPES.INPUT_GATE && Main.isGate(Main.objects[key].type)) {
    var centerX = obj.left;
    var centerY = y;
    return {
      type: "input",
      centerX: centerX,
      centerY: centerY,
      index: 0
    };
  }
  return {
    type: "none"
  };
};

module.exports = {
  onKeyDown: function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    if (key == 8)
      isDeleting = true;
  },


  onKeyUp: function (e) {
    var key = e.keyCode ? e.keyCode : e.which;
    if (key == 8)
      isDeleting = false;
    if (key == 18) {
      // copy
    }
  },

  // displaying the name of the component when hovering over
  onMouseOver: function (options) {
    if (options.target && Main.isEditableObject(options.target.id)) {
      var id = options.target.id;
      if (isDeleting) {
        removeObject(Main.objects[id], 0);
        Main.updateOutputs();
      } else if (Main.objects[id]) {
        if (Main.objects[id].type == Constants.TYPES.INPUT_GATE)
          $('#current-hovered-element').text("Hovered: Input Gate: " + getInputId(id) + ".");
        else if (Main.objects[id].type == Constants.TYPES.OUTPUT_GATE)
          $('#current-hovered-element').text("Hovered: Output Gate: " + getOutputId(id) + ".");
        else
          $('#current-hovered-element').text("Hovered: " + Main.getGate(Main.objects[id].type) + ".");
      }
    } else {
      $('#current-hovered-element').text("Hovered: No element.");
    }
  },

  onMouseUp: function (options) {
    // handling clicks
    if (new Date().getTime() - mouseDownTime < 100) {
      // creating new editable gate
      if (options.target && options.target.isToolbox) {
        if (Main.isCustomGate(options.target.type)) {
          var top = (Constants.GATES.length - 1 + Object.keys(Main.customObjects).length - 1) * Constants.OPTS.gridSize;
          var left = Constants.OPTS.gridSize;
          Main.createCustomGate(Main.customObjects[options.target.id], false, top, left, function (customObject, element) {
            var customGateId = element.id;
            element.id = Main.currObjectId++;
            Vue.set(Main.objects, element.id, {
              id: element.id,
              element: element,
              type: Constants.TYPES.CUSTOM_GATE,
              inputLength: customObject.inputLength,
              outputLength: customObject.outputLength,
              table: customObject.table,
              outputs: [],
              inputs: [],
              top: element.top,
              left: element.left,
              width: element.width,
              height: element.height,
              state: Constants.STATES.INPUT_OFF,
              getOutput: customObject.getOutput
            });
            Main.canvas.add(element);
          });
        } else {
          var currGate = Constants.GATES[options.target.id];
          fabric.Image.fromURL(currGate.url, function (oImage) {
            Main.canvas.add(oImage);
            Vue.set(Main.objects, oImage.id, {
              id: oImage.id,
              element: oImage,
              type: currGate.type,
              outputs: [],
              inputs: [],
              top: currGate.id * Constants.OPTS.gridSize,
              left: Constants.OPTS.gridSize,
              width: Constants.OPTS.gridSize,
              height: Constants.OPTS.gridSize,
              state: Constants.STATES.INPUT_OFF,
              getOutput: Constants.TYPE_OUTPUTS[currGate.type]
            });
          }, {
            id: Main.currObjectId++,
            top: currGate.id * Constants.OPTS.gridSize,
            left: Constants.OPTS.gridSize,
            height: Constants.OPTS.gridSize,
            width: Constants.OPTS.gridSize,
            hasBorders: false,
            hasControls: false,
            hasRotatingPoint: false
          });
        }
      }

      // changing input
      else if (options.target && Main.objects[options.target.id] &&
        Main.objects[options.target.id].type == Constants.TYPES.INPUT_GATE) {

        var currGate = Main.objects[options.target.id];
        currGate.state = currGate.state == Constants.STATES.INPUT_ON ? Constants.STATES.INPUT_OFF :
          Constants.STATES.INPUT_ON;

        currGate.element.setSrc(currGate.state, function () {
          Main.canvas.renderAll();
        });

        Main.updateOutputs();

      }
    }

    // finishing wire connection
    if (hline1 && hline2 && vline && creatingLine) {
      var x = hline2.element.x2;
      var y = hline2.element.y2;
      var connected = false;

      Vue.set(Main.objects, hline1.id, hline1);
      Vue.set(Main.objects, hline2.id, hline2);
      Vue.set(Main.objects, vline.id, vline);

      for (var key in Main.objects) {
        var currGate = Main.objects[key];

        var connectionInfo;
        if (Main.isCustomGate(Main.objects[key].type))
          connectionInfo = getCustomGateConnection(key, x, y);
        else
          connectionInfo = getGateConnection(key, x, y)
        if (connectionInfo.type == "input") {
          if (isDrawingFromInput)
            continue;
          if (currGate.id == startComponentId)
            continue;
          hline2.outputs.push(currGate.id);
          currGate.inputs.push({
            id: hline2.id,
            inputIndex: 0,
            outputIndex: connectionInfo.index
          });

          hline2.element.set({
            y1: connectionInfo.centerY,
            y2: connectionInfo.centerY,
            x2: connectionInfo.centerX
          });
          hline2.element.setCoords();
          if (hline2.inputs.length == 1) {
            Main.objects[hline2.inputs[0].id].element.set({
              y2: connectionInfo.centerY
            });
            Main.objects[hline2.inputs[0].id].element.setCoords();
          }

          connected = true;

          Main.updateOutputs();
          Main.canvas.renderAll();
        }

        if (connectionInfo.type == "output") {
          if (isDrawingFromOutput)
            continue;
          if (currGate.id == startComponentId)
            continue;
          hline2.inputs.push({
            id: currGate.id,
            inputIndex: connectionInfo.index,
            outputIndex: 0
          });
          currGate.outputs.push(hline2.id);

          hline2.element.set({
            x2: connectionInfo.centerX,
            y1: connectionInfo.centerY,
            y2: connectionInfo.centerY
          });
          hline2.element.setCoords();
          if (hline2.outputs.length == 1) {
            Main.objects[hline2.outputs[0]].element.set({
              y2: connectionInfo.centerY
            });
            Main.objects[hline2.outputs[0]].element.setCoords();
          }

          connected = true;

          Main.updateOutputs();
          Main.canvas.renderAll();
        }
      }

      if (!connected) {
        for (var i = 0; i < hline1.inputs.length; i++)
          if (Main.objects[hline1.inputs[i].id].outputs.length == 1 && Main.objects[Main.objects[hline1.inputs[i].id].outputs[0]] == hline1)
            Main.objects[hline1.inputs[i].id].outputs = [];
        if (hline1.outputs.length == 1) {
          Main.objects[hline1.outputs[0]].inputs = Main.objects[hline1.outputs[0]].inputs.filter(function (el) {
            return Main.objects[el.id].id != hline1.id;
          });
        }
        Main.canvas.remove(hline1.element);
        Main.canvas.remove(hline2.element);
        Main.canvas.remove(vline.element);
        Vue.delete(Main.objects, hline1.id);
        Vue.delete(Main.objects, hline2.id);
        Vue.delete(Main.objects, vline.id);
      }

      hline1 = null;
      hline2 = null;
      vline = null;
      startComponentId = null;
    }

    creatingLine = false;
    isDrawingFromInput = false;
    isDrawingFromOutput = false;
  },

  onObjectMoving: function (options) {
    if (Main.isGate(Main.objects[options.target.id].type)) {
      var startX = Main.objects[options.target.id].left;
      var startY = Main.objects[options.target.id].top;
      var finalX = Math.round(options.target.left / Constants.OPTS.gridSize) * Constants.OPTS.gridSize;
      var finalY = Math.round(options.target.top / Constants.OPTS.gridSize) * Constants.OPTS.gridSize;

      options.target.set({
        left: finalX,
        top: finalY
      });

      options.target.setCoords();

      Main.objects[options.target.id].left = finalX;
      Main.objects[options.target.id].top = finalY;

      var vis = new FastSet();
      propagateInputMovement(finalX - startX, finalY - startY, Main.objects[options.target.id], 0, startX, startY, vis);
      vis.clear();
      propagateOutputMovement(finalX - startX, finalY - startY, Main.objects[options.target.id], 0, startX + 50, startY, vis);

      Main.canvas.renderAll();

    } else {
      var y1 = Main.objects[options.target.id].y1;
      var y2 = Main.objects[options.target.id].y2;

      var element = Main.objects[options.target.id];
      var inputElement = Main.objects[Main.objects[element.inputs[0].id].id];
      var outputElement = Main.objects[Main.objects[element.outputs[0]].id];

      var xcoords = [inputElement.element.x1, inputElement.element.x2, outputElement.element.x1, outputElement.element.x2];
      xcoords.sort();
      var jointX;
      for (var i = 0; i < 3; i++)
        if (Math.abs(xcoords[i] - xcoords[i + 1]) < Constants.EPS)
          jointX = xcoords[i];

      if (Math.abs(inputElement.element.x1 - jointX) < Constants.EPS)
        inputElement.element.set({x1: options.target.left});
      else
        inputElement.element.set({x2: options.target.left});

      if (Math.abs(outputElement.element.x1 - jointX) < Constants.EPS)
        outputElement.element.set({x1: options.target.left});
      else
        outputElement.element.set({x2: options.target.left});

      element.element.set({
        y1: y1,
        y2: y2,
        x1: options.target.left,
        x2: options.target.left
      });

      inputElement.element.setCoords();
      outputElement.element.setCoords();
      element.element.setCoords();

      Main.canvas.renderAll();
    }
  },

  onMouseMove: function (options) {
    if (creatingLine) {
      var pointer = Main.canvas.getPointer(options.e);
      var finalX = pointer.x;
      var finalY = pointer.y;

      hline1.element.set({
        x1: initialX,
        x2: (finalX + initialX) / 2.0,
        y1: initialY,
        y2: initialY
      });

      vline.element.set({
        x1: (finalX + initialX) / 2.0,
        x2: (finalX + initialX) / 2.0,
        y1: initialY,
        y2: finalY
      });

      hline2.element.set({
        x1: (finalX + initialX) / 2.0,
        x2: finalX,
        y1: finalY,
        y2: finalY
      });

      vline.y1 = vline.element.y1;
      vline.y2 = vline.element.y2;

      hline1.element.setCoords();
      hline2.element.setCoords();
      vline.element.setCoords();

      Main.canvas.renderAll();
    }

    var pointer = Main.canvas.getPointer(options.e);
    var x = pointer.x;
    var y = pointer.y;

    while (selectableIndicator.length > 0)
      Main.canvas.remove(selectableIndicator.pop());

    for (var key in Main.objects) {
      if (Main.isCustomGate(Main.objects[key].type)) {
        var connectionInfo = getCustomGateConnection(key, x, y);
        if (connectionInfo.type == "input") {
          var currObject = new fabric.Circle({
            radius: 5,
            top: connectionInfo.centerY - 2.5 - 1.0,
            left: connectionInfo.centerX - 5.0,
            fill: "#81a2be",
            opacity: 0.8,
            selectable: false
          });

          selectableIndicator.push(currObject);
          Main.canvas.add(currObject);
        } else if (connectionInfo.type == "output") {
          var currObject = new fabric.Circle({
            radius: 5,
            top: connectionInfo.centerY - 2.5 - 1.0,
            left: connectionInfo.centerX - 2.5,
            fill: "#81a2be",
            opacity: 0.8,
            selectable: false
          });

          selectableIndicator.push(currObject);
          Main.canvas.add(currObject);
        }
      } else {
        var connectionInfo = getGateConnection(key, x, y);

        if (connectionInfo.type == "output") {
          var currObject = new fabric.Circle({
            radius: 5,
            top: connectionInfo.centerY - 2.5 - 1.0,
            left: connectionInfo.centerX - 2.5,
            fill: "#81a2be",
            opacity: 0.8,
            selectable: false
          });
          selectableIndicator.push(currObject);
          Main.canvas.add(currObject);
        } else if (connectionInfo.type == "input") {
          var currObject = new fabric.Circle({
            radius: 5,
            top: connectionInfo.centerY - 2.5 - 1.0,
            left: connectionInfo.centerX - 5.0,
            fill: "#81a2be",
            opacity: 0.8,
            selectable: false
          });
          selectableIndicator.push(currObject);
          Main.canvas.add(currObject);
        }
      }
    }
  },

  onMouseDown: function (options) {
    mouseDownTime = new Date().getTime();
    if (!creatingLine) {
      for (var key in Main.objects) {
        var obj = Main.objects[key].element;

        var pointer = Main.canvas.getPointer(options.e);
        var x = pointer.x;
        var y = pointer.y;

        if (!Main.isGate(Main.objects[key].type))
          continue;

        var connectionInfo;
        if (Main.isCustomGate(Main.objects[key].type))
          connectionInfo = getCustomGateConnection(key, x, y);
        else
          connectionInfo = getGateConnection(key, x, y)

        var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + obj.height;
        var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

        if (connectionInfo.type != "none") {
          if (connectedOutput && Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
            continue;
          if (connectedInput && Main.objects[key].type == Constants.TYPES.INPUT_GATE)
            continue;
          if (connectionInfo.type == "input")
            isDrawingFromInput = true;
          if (connectionInfo.type == "output")
            isDrawingFromOutput = true;

          creatingLine = true;
          startComponentId = key;

          initialX = connectionInfo.centerX;
          initialY = connectionInfo.centerY;

          var hlineElement1 = new fabric.Line([initialX, initialY, initialX, initialY], {
            id: Main.currObjectId++,
            stroke: '#81a2be',
            selectable: false,
            strokeWidth: 3
          });

          var hlineElement2 = new fabric.Line([initialX, initialY, initialX, initialY], {
            id: Main.currObjectId++,
            stroke: '#81a2be',
            selectable: false,
            strokeWidth: 3
          });

          var vlineElement = new fabric.Line([initialX, initialY, initialX, initialY], {
            id: Main.currObjectId++,
            stroke: '#81a2be',
            selectable: true,
            hasControls: false,
            strokeWidth: 3,
          });

          hline1 = {
            id: hlineElement1.id,
            element: hlineElement1,
            type: Constants.TYPES.HORIZONTAL_LINE,
            outputs: [],
            inputs: [],
            getOutput: Constants.TYPE_OUTPUTS[Constants.TYPES.HORIZONTAL_LINE]
          };

          hline2 = {
            id: hlineElement2.id,
            element: hlineElement2,
            type: Constants.TYPES.HORIZONTAL_LINE,
            outputs: [],
            inputs: [],
            getOutput: Constants.TYPE_OUTPUTS[Constants.TYPES.HORIZONTAL_LINE]
          }

          vline = {
            id: vlineElement.id,
            element: vlineElement,
            type: Constants.TYPES.VERTICAL_LINE,
            y1: initialY,
            y2: initialY,
            outputs: [],
            inputs: [],
            getOutput: Constants.TYPE_OUTPUTS[Constants.TYPES.VERTICAL_LINE]
          };

          Main.canvas.add(hlineElement1);
          Main.canvas.add(hlineElement2);
          Main.canvas.add(vlineElement);

          if (connectionInfo.type == "output") {
            hline1.inputs.push({
              id: Main.objects[key].id,
              inputIndex: connectionInfo.index,
              outputIndex: 0
            });
            hline1.outputs = [vline.id];

            vline.inputs.push({
              id: hline1.id,
              inputIndex: 0,
              outputIndex: 0
            });
            vline.outputs = [hline2.id];

            hline2.inputs.push({
              id: vline.id,
              inputIndex: 0,
              outputIndex: 0,
            });

            Main.objects[key].outputs.push(hline1.id);
          } else {
            hline1.outputs = [Main.objects[key].id];
            vline.outputs = [hline1.id];
            hline2.outputs = [vline.id];

            Main.objects[key].inputs.push({
              id: hline1.id,
              inputIndex: 0,
              outputIndex: connectionInfo.index
            });
            hline1.inputs.push({
              id: vline.id,
              inputIndex: 0,
              outputIndex: 0
            });
            vline.inputs.push({
              id: hline2.id,
              inputIndex: 0,
              outputIndex: 0
            });
          }
        }
      }
    }
  }
}
