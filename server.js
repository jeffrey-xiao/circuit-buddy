var express = require('express');
var app = express();
var http = require('http').Server(app);
var morgan = require('morgan');
var bodyParser = require('body-parser');
var sassMiddleware = require('node-sass-middleware');

var Immutable = require('immutable');

var Map = Immutable.Map;
var List = Immutable.List;

var hostname = 'localhost';

var srcPath = __dirname;
var destPath = __dirname;

app.set('port', (process.env.PORT || 8080));

app.use(morgan('dev'));

app.use(sassMiddleware({
	src: srcPath,
	dest: destPath,
	debug: true,
	force: true,
	outputStyle: 'expanded'
}));

app.use('/', express.static(__dirname + '/public/'));

http.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});