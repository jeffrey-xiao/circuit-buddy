var ret = {};

ret.EPS = 1e-6;

ret.TYPES = {
	INPUT_GATE: 0,
	OUTPUT_GATE: 1,
	AND_GATE: 2,
	NAND_GATE: 3,
	OR_GATE: 4,
	NOR_GATE: 5,
	XOR_GATE: 6,
	NXOR_GATE: 7,
	NOT_GATE: 8,
	CUSTOM_GATE: 9,
	HORIZONTAL_LINE: 10,
	VERTICAL_LINE: 11
};

ret.TYPE_NAMES = ["Input Gate", "Output Gate", "And Gate", "Nand Gate", "Or Gate", 
			  	  "Nor Gate", "Xor Gate", "Nxor Gate", "Not Gate", "Custom Gate", "Horizontal Line", "Vertical Line"];

// inputs are an array of binary
ret.TYPE_OUTPUTS = [
	// input gate
	function (inputs) {
		return [inputs[0]];
	},

	// output gate
	function (inputs) {
		if (inputs.length == 0)
			return [0];
		return [inputs[0]];
	},

	// and gate
	function (inputs) {
		var ret = 1;
		for (var i = 0; i < inputs.length; i++)
			ret &= inputs[i];
		return [ret & (inputs.length > 0)];
	},

	// nand gate
	function (inputs) {
		var ret = 1;
		for (var i = 0; i < inputs.length; i++)
			ret &= inputs[i];
		return [!ret & (inputs.length > 0)];
	},

	// or gate
	function (inputs) {
		var ret = 0;
		for (var i = 0; i < inputs.length; i++)
			ret |= inputs[i];
		return [ret & (inputs.length > 0)];
	},

	// nor gate
	function (inputs) {
		var ret = 0;
		for (var i = 0; i < inputs.length; i++)
			ret |= inputs[i];
		return [!ret & (inputs.length > 0)];
	},

	// xor gate
	function (inputs) {
		var ret = 0;
		for (var i = 0; i < inputs.length; i++)
			ret ^= inputs[i];
		return [ret & (inputs.length > 0)];
	},

	// nxor gate
	function (inputs) {
		var ret = 0;
		for (var i = 0; i < inputs.length; i++)
			ret ^= inputs[i];
		return [!ret & (inputs.length > 0)];
	},

	// not gate
	function (inputs) {
		if (inputs.length == 0)
			return [0];
		return [!inputs[0]];
	},

	// custom gate
	function (inputs) {
		console.log("ERROR HAVE TO IMPLEMENT");
	},

	// horizontal line
	function (inputs) {
		if (inputs.length == 0)
			return [0];
		return [inputs[0]];
	},

	// vertical line
	function (inputs) {
		if (inputs.length == 0)
			return [0];
		return [inputs[0]];
	}
];

ret.OPTS = {
	height: Math.round((window.innerHeight - 160) / 50.0) * 50,
	width: Math.round((window.outerWidth - 450) / 50.0) * 50,
	gridSize: 50,
	initialObjectId: 12
};

ret.STATES = {
	INPUT_ON: "img/input_gate_on.png",
	INPUT_OFF: "img/input_gate_off.png",
	OUTPUT_ON: "img/output_gate_on.png",
	OUTPUT_OFF: "img/output_gate_off.png"
};

ret.GATES = [
	{
		url: ret.STATES.INPUT_OFF,
		id: ret.TYPES.INPUT_GATE,
		type: ret.TYPES.INPUT_GATE
	},
	{
		url: ret.STATES.OUTPUT_OFF,
		id: ret.TYPES.OUTPUT_GATE,
		type: ret.TYPES.OUTPUT_GATE
	},
	{
		url: 'img/and_gate.png',
		id: ret.TYPES.AND_GATE,
		type: ret.TYPES.AND_GATE
	},
	{
		url: 'img/nand_gate.png',
		id: ret.TYPES.NAND_GATE,
		type: ret.TYPES.NAND_GATE
	},
	{
		url: 'img/or_gate.png',
		id: ret.TYPES.OR_GATE,
		type: ret.TYPES.OR_GATE
	},
	{
		url: 'img/nor_gate.png',
		id: ret.TYPES.NOR_GATE,
		type: ret.TYPES.NOR_GATE
	},
	{
		url: 'img/xor_gate.png',
		id: ret.TYPES.XOR_GATE,
		type: ret.TYPES.XOR_GATE
	},
	{
		url: 'img/nxor_gate.png',
		id: ret.TYPES.NXOR_GATE,
		type: ret.TYPES.NXOR_GATE
	},
	{
		url: 'img/not_gate.png',
		id: ret.TYPES.NOT_GATE,
		type: ret.TYPES.NOT_GATE
	},
	{
		url: 'img/custom_gate.png',
		id: ret.TYPES.CUSTOM_GATE,
		type: ret.TYPES.CUSTOM_GATE
	}
];

module.exports = ret;