var express = require('express');
var app = express();
var http = require('http').Server(app);
var morgan = require('morgan');
var bodyParser = require('body-parser');

var Immutable = require('immutable');

var Map = Immutable.Map;
var List = Immutable.List;

var hostname = 'localhost';

var srcPath = __dirname;
var destPath = __dirname;

app.set('port', (process.env.PORT || 8080));

app.use(morgan('dev'));

app.use('/', express.static(__dirname + '/static/'));

http.listen(app.get('port'), function () {
	console.log('Node app is running on port', app.get('port'));
});