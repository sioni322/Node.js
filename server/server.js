/* server.js : Start Node.js server program with port# 8080, by Sion Lee */


//Import modules & packages
var express = require('express');
var app = express();
var mongoose = require('mongoose');
var db = mongoose.connection;
var bodyparser = require('body-parser');


//Run database
db.on('error', function() {
	console.log('DB: Failed to connect MongoDB');
});
db.once('open', function() {
	console.log('DB: MongoDB is running......');
});

mongoose.set('useCreateIndex', true);
mongoose.connect('mongodb://localhost/',
	{
		useNewUrlParser : true,
		useUnifiedTopology : true
	});


//Define model
var User = require('../database/model_user.js');
var Project = require('../database/model_project.js');
var Label = require('../database/model_label.js');

//Configure bodyparser
app.use(bodyparser.urlencoded({
	limit: '500mb',
	extended: false,
	parameterLimit: 1000000}));

app.use(bodyparser.json({
	limit: '500mb'}));

app.use(express.static(__dirname+ '/../../project'));

//Define router
var user = require('../routers/router_user.js');
app.use('/user', user);
var project = require('../routers/router_project.js');
app.use('/project', project);
var board = require('../routers/router_board.js');
app.use('/board', board);
var label = require('../routers/router_labeling.js');
app.use('/label', label);
var shop = require('../routers/router_shop.js');
app.use('/shop', shop);


//Run server
var server = app.listen(8080, function() {
	console.log('Server: Server is running......');
});

