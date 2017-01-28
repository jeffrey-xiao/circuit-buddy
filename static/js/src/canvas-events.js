var CanvasEvents = (function (Constants, Main) {
	var hline1, hline2, vline, startComponentId;
	var initialX, initialY;
	var mouseDownTime;
	var isDrawingFromInput = false, isDrawingFromOutput = false, creatingLine = false, isDeleting = false;
	var selectableIndicator = [];

	var propagateInputMovement = function (dx, dy, element, depth, prevX, prevY) {
		if (depth == 2 || !element)
			return;
		for (var i = 0; i < element.inputs.length; i++) {
			var input = Main.objects[element.inputs[i]];
			var nextPrevX = input.element.x2;
			var nextPrevY = input.element.y2;
			if (input.type == Constants.TYPES.HORIZONTAL_LINE) {
				if (Math.abs(input.element.x2 - prevX) < 1e-6) {
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
				if (Math.abs(input.element.y2 - prevY) < 1e-6) {
					input.element.set({
						y2: input.element.y2 + dy
					});
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
			propagateInputMovement(dx, dy, input, depth + 1, nextPrevX, nextPrevY);
		}
	}

	var propagateOutputMovement = function (dx, dy, element, depth, prevX, prevY) {
		if (depth == 2 || !element)
			return;
		for (var i = 0; i < element.outputs.length; i++) {
			var output = Main.objects[element.outputs[i]];
			var nextPrevX = output.element.x2;
			var nextPrevY = output.element.y2;
			if (output.type == Constants.TYPES.HORIZONTAL_LINE) {
				if (Math.abs(output.element.x2 - prevX) < 1e-6) {
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
				if (Math.abs(output.element.y2 - prevY) < 1e-6) {
					output.element.set({
						y2: output.element.y2 + dy
					});
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
			propagateOutputMovement(dx, dy, output, depth + 1, nextPrevX, nextPrevY);
		}
	}

	var getInputId = function (id) {
		var ids = [];
		
		for (var key in Main.objects)
			if (Main.objects[key].type == Constants.TYPES.INPUT_GATE)
				ids.push(Main.objects[key].element.id);

		ids.sort();

		for (var i = 0; i < ids.length; i++)
			if (ids[i] == id) 
				return String.fromCharCode(65 + i);
	};

	var getOutputId = function (id) {
		var ids = [];
		
		for (var key in Main.objects)
			if (Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
				ids.push(Main.objects[key].element.id);

		ids.sort();

		for (var i = 0; i < ids.length; i++)
			if (ids[i] == id) 
				return String.fromCharCode(88 + i);
	};

	var removeObject = function (element, depth) {
		if (depth == 4 || !element || !element.element)
			return;

		for (var i = 0; i < element.inputs.length; i++) {
			var nextInputElement = Main.objects[element.inputs[i]];
			var index = nextInputElement.outputs.indexOf(element.element.id);
			nextInputElement.outputs.splice(index);
			removeObject(nextInputElement, depth + 1);
		}

		for (var i = 0; i < element.outputs.length; i++) {
			var nextOutputElement = Main.objects[element.outputs[i]];
			var index = nextOutputElement.inputs.indexOf(element.element.id);
			nextOutputElement.inputs.splice(index);
			removeObject(nextOutputElement, depth + 1);
		}

		Main.canvas.remove(element.element);
		Vue.delete(Main.objects, element.element.id);
	};

	return {
		onKeyDown: function (e) {
			var key = e.keyCode ? e.keyCode : e.which;
			if (key == 8)
				isDeleting = true;
		},


		onKeyUp: function (e) {
			var key = e.keyCode ? e.keyCode : e.which;
			if (key == 8)
				isDeleting = false;
		},

		// displaying the name of the component when hovering over
		onMouseOver: function (options) {
			if (options.target && Main.isEditableObject(options.target.id)) {
				var id = options.target.id;
				if (isDeleting) {
					removeObject(Main.objects[id], 0);
					
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
					var currGate = Constants.GATES[options.target.id];
					fabric.Image.fromURL(currGate.url, function (oImage) {
						Main.canvas.add(oImage);
						Vue.set(Main.objects, oImage.id, {
							element: oImage,
							type: currGate.type,
							outputs: [],
							inputs: [],
							top: currGate.id * Constants.OPTS.gridSize,
							left: Constants.OPTS.gridSize,
							width: Constants.OPTS.gridSize,
							height: Constants.OPTS.gridSize,
							state: Constants.STATES.INPUT_OFF
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
				Vue.set(Main.objects, hline1.element.id, hline1);
				Vue.set(Main.objects, hline2.element.id, hline2);
				Vue.set(Main.objects, vline.element.id, vline);

				for (var key in Main.objects) {
					var currGate = Main.objects[key];
					if (Main.isGate(currGate.type) && currGate.element.left - 10 <= x && x <= currGate.element.left + 10 &&
						currGate.element.top <= y && y <= currGate.element.top + 50) {
						if (currGate.type == Constants.TYPES.INPUT_GATE)
							continue;
						if (isDrawingFromOutput)
							continue;
						if (currGate.element.id == startComponentId)
							continue;
						hline2.outputs.push(currGate.element.id);
						currGate.inputs.push(hline2.element.id);

						hline2.element.set({
							x2: currGate.element.left
						});
						hline2.element.setCoords();

						connected = true;

						Main.updateOutputs();
						Main.canvas.renderAll();
						
					}
					if (Main.isGate(currGate.type) && currGate.element.left + 40 <= x && x <= currGate.element.left + 60 &&
						currGate.element.top + 20 <= y && y <= currGate.element.top + 30) {
						if (currGate.type == Constants.TYPES.OUTPUT_GATE)
							continue;
						if (isDrawingFromInput)
							continue;
						if (currGate.element.id == startComponentId)
							continue;
						hline2.inputs.push(currGate.element.id);
						if (hline2.outputs.length == 1) {
							if (Math.abs(Main.objects[hline2.outputs[0]].element.y1 - hline2.element.y2) < 1e-6) {
								Main.objects[hline2.outputs[0]].element.set({
									y1: currGate.element.top + 25
								});
								Main.objects[hline2.outputs[0]].element.setCoords();
							}
							if (Math.abs(Main.objects[hline2.outputs[0]].element.y2 - hline2.element.y2) < 1e-6) {
								Main.objects[hline2.outputs[0]].element.set({
									y2: currGate.element.top + 25
								});
								Main.objects[hline2.outputs[0]].element.setCoords();
							}
						}
						currGate.outputs.push(hline2.element.id);

						hline2.element.set({
							x2: currGate.element.left + 50,
							y1: currGate.element.top + 25,
							y2: currGate.element.top + 25
						});
						hline2.element.setCoords();

						connected = true;
						
						Main.updateOutputs();
						Main.canvas.renderAll();
						
					}
				}

				
				if (!connected) {
					for (var i = 0; i < hline1.inputs.length; i++)
						if (Main.objects[hline1.inputs[i]].outputs.length == 1 && Main.objects[Main.objects[hline1.inputs[i]].outputs[0]] == hline1)
							Main.objects[hline1.inputs[i]].outputs = [];
					if (hline1.outputs.length == 1) {
						Main.objects[hline1.outputs[0]].inputs = Main.objects[hline1.outputs[0]].inputs.filter(function (el) {
							return Main.objects[el].element.id != hline1.element.id;
						});
					}
					Main.canvas.remove(hline1.element);
					Main.canvas.remove(hline2.element);
					Main.canvas.remove(vline.element);
					Vue.delete(Main.objects, hline1.element.id);
					Vue.delete(Main.objects, hline2.element.id);
					Vue.delete(Main.objects, vline.element.id);
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

				propagateInputMovement(finalX - startX, finalY - startY, Main.objects[options.target.id], 0, startX, startY);
				propagateOutputMovement(finalX - startX, finalY - startY, Main.objects[options.target.id], 0, startX + 50, startY);
				
				Main.canvas.renderAll();
				
			} else {
				var y1 = Main.objects[options.target.id].y1;
				var y2 = Main.objects[options.target.id].y2;

				var element = Main.objects[options.target.id];
				var inputElement = Main.objects[Main.objects[element.inputs[0]].element.id];
				var outputElement = Main.objects[Main.objects[element.outputs[0]].element.id];

				if (Math.abs(inputElement.element.x1 - options.target.x1) < 1e-6)
					inputElement.element.set({x1: options.target.left});
				else 
					inputElement.element.set({x2: options.target.left});

				if (Math.abs(outputElement.element.x1 - options.target.x1) < 1e-6)
					outputElement.element.set({x1: options.target.left});
				else 
					outputElement.element.set({x2: options.target.left});

				options.target.set({
					y1: y1,
					y2: y2,
					x1: options.target.left,
					x2: options.target.left
				});

				options.target.setCoords();

				inputElement.element.setCoords();
				outputElement.element.setCoords();
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
				var obj = Main.objects[key].element;
				var connectedInput = obj.left - 15 <= x && x <= obj.left && obj.top + 5 <= y && y <= obj.top + 45;
				var connectedOutput = obj.left + 50 <= x && x <= obj.left + 65 && obj.top <= y && y <= obj.top + 50;

				if (connectedOutput && Main.objects[key].type != Constants.TYPES.OUTPUT_GATE && Main.isGate(Main.objects[key].type)) {
					var centerX = obj.left;
					var centerY = obj.top + 25;
					var currObject = new fabric.Circle({
						radius: 5,
						top: centerY - 3.5,
						left: centerX + 48,
						fill: "#81a2be",
						opacity: 0.8,
						selectable: false
					});
					selectableIndicator.push(currObject);
					Main.canvas.add(currObject);
				} else if (connectedInput && Main.objects[key].type != Constants.TYPES.INPUT_GATE && Main.isGate(Main.objects[key].type)) {
					var centerX = obj.left;
					var centerY = y;
					var currObject = new fabric.Circle({
						radius: 5,
						top: centerY - 3.5,
						left: centerX - 6,
						fill: "#81a2be",
						opacity: 0.8,
						selectable: false
					});
					selectableIndicator.push(currObject);
					Main.canvas.add(currObject);
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

					
					if (Main.isGate(Main.objects[key].type)) {
						var connectedInput = obj.left - 10 <= x && x <= obj.left && obj.top <= y && y <= obj.top + obj.height;
						var connectedOutput = obj.left + 50 <= x && x <= obj.left + 60 && obj.top + 20 <= y && y <= obj.top + 30;

						if (connectedInput || connectedOutput) {
							if (connectedOutput && Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
								continue;
							if (connectedInput && Main.objects[key].type == Constants.TYPES.INPUT_GATE)
								continue;
							if (connectedOutput && Main.objects[key].type == Constants.TYPES.INPUT_GATE)
								isDrawingFromInput = true;
							if (connectedInput && Main.objects[key].type == Constants.TYPES.OUTPUT_GATE)
								isDrawingFromOutput = true;
							creatingLine = true;
							startComponentId = key;

							initialX = obj.left;
							initialY = y;

							if (connectedOutput) {
								initialX = obj.left + 50;
								initialY = obj.top + 25;
							}

							var hlineElement1 = new fabric.Line([initialX, initialY, initialX, initialY], {
								stroke: '#81a2be',
								id: Main.currObjectId++,
								selectable: false,
								strokeWidth: 3
							});

							var hlineElement2 = new fabric.Line([initialX, initialY, initialX, initialY], {
								stroke: '#81a2be',
								id: Main.currObjectId++,
								selectable: false,
								strokeWidth: 3
							});

							var vlineElement = new fabric.Line([initialX, initialY, initialX, initialY], {
								stroke: '#81a2be',
								id: Main.currObjectId++,
								selectable: true,
								hasControls: false,
								strokeWidth: 3
							});

							hline1 = {
								element: hlineElement1,
								type: Constants.TYPES.HORIZONTAL_LINE,
								outputs: [],
								inputs: []
							}; 

							hline2 = {
								element: hlineElement2,
								type: Constants.TYPES.HORIZONTAL_LINE,
								outputs: [],
								inputs: []
							}

							vline = {
								element: vlineElement,
								type: Constants.TYPES.VERTICAL_LINE,
								y1: initialY,
								y2: initialY,
								outputs: [],
								inputs: []
							}; 

							Main.canvas.add(hlineElement1);
							Main.canvas.add(hlineElement2);
							Main.canvas.add(vlineElement);

							if (connectedOutput) {
								hline1.inputs.push(Main.objects[key].element.id);
								hline1.outputs = [vline.element.id];

								vline.inputs.push(hline1.element.id);
								vline.outputs = [hline2.element.id];

								hline2.inputs.push(vline.element.id);

								Main.objects[key].outputs.push(hline1.element.id);
							} else {
								hline1.outputs = [Main.objects[key].element.id];
								vline.outputs = [hline1.element.id];
								hline2.outputs = [vline.element.id];

								Main.objects[key].inputs.push(hline1.element.id);
								hline1.inputs.push(vline.element.id);
								vline.inputs.push(hline2.element.id);
							}
							
						}
					}
				}
			}
		}
	}
}(Constants, Main));