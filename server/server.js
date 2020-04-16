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

mongoose.connect('mongodb://localhost/',
	{
		useNewUrlParser : true,
		useUnifiedTopology : true
	});


//Define model
var User = require('../database/models/models.js');



//Configure bodyparser
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());



//Define router
var router = require('../routers/routers.js');
app.use('/', router);



//Run server
var server = app.listen(8080, function() {
	console.log('Server: Server is running......');
});
